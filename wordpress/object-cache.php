<?php
/**
 * Redis Object Cache Drop-in
 * 
 * This file is part of the Redis Object Cache plugin.
 * 
 * @package Redis Object Cache
 * @version 2.4.3
 * @author Till Krüss
 * @license GPL-3.0+
 * @link https://github.com/rhubarbgroup/redis-cache
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Redis Object Cache Drop-in
 * 
 * @package Redis Object Cache
 * @version 2.4.3
 */
class WP_Object_Cache {

    /**
     * Holds the cached objects
     *
     * @var array
     */
    private $cache = array();

    /**
     * The amount of times the cache data was already stored in the cache.
     *
     * @var int
     */
    private $cache_hits = 0;

    /**
     * Amount of times the cache did not have the request in cache
     *
     * @var int
     */
    private $cache_misses = 0;

    /**
     * List of global groups
     *
     * @var array
     */
    private $global_groups = array();

    /**
     * The blog prefix to prepend to keys in non-global groups.
     *
     * @var int
     */
    private $blog_prefix;

    /**
     * Holds the value of is_multisite()
     *
     * @var bool
     */
    private $multisite;

    /**
     * Redis connection
     *
     * @var Redis
     */
    private $redis;

    /**
     * Redis server configuration
     *
     * @var array
     */
    private $redis_config = array();

    /**
     * Whether Redis is available
     *
     * @var bool
     */
    private $redis_available = false;

    /**
     * Sets up object properties; PHP 5 style constructor
     *
     * @return null
     */
    public function __construct() {
        global $blog_id;

        $this->multisite = is_multisite();
        $this->blog_prefix = $this->multisite ? $blog_id : 1;

        $this->redis_config = array(
            'host' => defined('WP_REDIS_HOST') ? WP_REDIS_HOST : '127.0.0.1',
            'port' => defined('WP_REDIS_PORT') ? WP_REDIS_PORT : 6379,
            'timeout' => defined('WP_REDIS_TIMEOUT') ? WP_REDIS_TIMEOUT : 1,
            'read_timeout' => defined('WP_REDIS_READ_TIMEOUT') ? WP_REDIS_READ_TIMEOUT : 1,
            'retry_interval' => defined('WP_REDIS_RETRY_INTERVAL') ? WP_REDIS_RETRY_INTERVAL : 100,
            'auth' => defined('WP_REDIS_PASSWORD') ? WP_REDIS_PASSWORD : null,
            'database' => defined('WP_REDIS_DATABASE') ? WP_REDIS_DATABASE : 0,
            'compression' => defined('WP_REDIS_COMPRESSION') ? WP_REDIS_COMPRESSION : 'gzip',
            'serializer' => defined('WP_REDIS_SERIALIZER') ? WP_REDIS_SERIALIZER : 'php',
            'async_flush' => defined('WP_REDIS_ASYNC_FLUSH') ? WP_REDIS_ASYNC_FLUSH : false,
            'split_alloptions' => defined('WP_REDIS_SPLIT_ALLOPTIONS') ? WP_REDIS_SPLIT_ALLOPTIONS : false,
            'prefetch' => defined('WP_REDIS_PREFETCH') ? WP_REDIS_PREFETCH : false,
            'debug' => defined('WP_REDIS_DEBUG') ? WP_REDIS_DEBUG : false,
        );

        $this->init_redis();
    }

    /**
     * Initialize Redis connection
     */
    private function init_redis() {
        if (!class_exists('Redis')) {
            return;
        }

        try {
            $this->redis = new Redis();
            $this->redis->connect(
                $this->redis_config['host'],
                $this->redis_config['port'],
                $this->redis_config['timeout']
            );

            if ($this->redis_config['auth']) {
                $this->redis->auth($this->redis_config['auth']);
            }

            if ($this->redis_config['database']) {
                $this->redis->select($this->redis_config['database']);
            }

            $this->redis_available = true;

            if ($this->redis_config['debug']) {
                error_log('Redis Object Cache: Connected successfully');
            }

        } catch (Exception $e) {
            $this->redis_available = false;
            
            if ($this->redis_config['debug']) {
                error_log('Redis Object Cache: Connection failed - ' . $e->getMessage());
            }
        }
    }

    /**
     * Adds data to the cache if it doesn't already exist.
     *
     * @param int|string $key    What to call the contents in the cache
     * @param mixed      $data   The contents to store in the cache
     * @param string     $group  Optional. Where to group the cache contents. Default 'default'.
     * @param int        $expire Optional. When to expire the cache contents. Default 0 (no expiration).
     * @return bool False if cache key and group already exist, true on success
     */
    public function add($key, $data, $group = 'default', $expire = 0) {
        if (wp_suspend_cache_addition()) {
            return false;
        }

        if (empty($group)) {
            $group = 'default';
        }

        $id = $key;
        if ($this->multisite && !isset($this->global_groups[$group])) {
            $id = $this->blog_prefix . ':' . $key;
        }

        if ($this->_exists($id, $group)) {
            return false;
        }

        return $this->set($key, $data, $group, $expire);
    }

    /**
     * Sets the list of global groups.
     *
     * @param array $groups List of groups that are global.
     */
    public function add_global_groups($groups) {
        $groups = (array) $groups;

        $groups = array_fill_keys($groups, true);
        $this->global_groups = array_merge($this->global_groups, $groups);
    }

    /**
     * Decrements numeric cache item's value.
     *
     * @param int|string $key    The cache key to decrement
     * @param int        $offset Optional. The amount by which to decrement the item's value. Default 1.
     * @param string     $group  Optional. The group the key is in. Default 'default'.
     * @return false|int False on failure, the item's new value on success.
     */
    public function decr($key, $offset = 1, $group = 'default') {
        if (empty($group)) {
            $group = 'default';
        }

        $id = $key;
        if ($this->multisite && !isset($this->global_groups[$group])) {
            $id = $this->blog_prefix . ':' . $key;
        }

        if (!$this->redis_available) {
            return false;
        }

        try {
            $redis_key = $this->build_key($id, $group);
            $value = $this->redis->decrBy($redis_key, $offset);
            
            if ($value < 0) {
                $value = 0;
                $this->redis->set($redis_key, $value);
            }

            return $value;
        } catch (Exception $e) {
            if ($this->redis_config['debug']) {
                error_log('Redis Object Cache: Decrement failed - ' . $e->getMessage());
            }
            return false;
        }
    }

    /**
     * Removes the contents of the cache key in the group
     *
     * @param int|string $key        What the contents in the cache are called
     * @param string     $group      Optional. Where the cache contents are grouped. Default 'default'.
     * @return bool True on successful removal, false on failure.
     */
    public function delete($key, $group = 'default') {
        if (empty($group)) {
            $group = 'default';
        }

        $id = $key;
        if ($this->multisite && !isset($this->global_groups[$group])) {
            $id = $this->blog_prefix . ':' . $key;
        }

        if (!$this->redis_available) {
            return false;
        }

        try {
            $redis_key = $this->build_key($id, $group);
            $result = $this->redis->del($redis_key);
            
            unset($this->cache[$this->build_key($id, $group)]);
            
            return $result > 0;
        } catch (Exception $e) {
            if ($this->redis_config['debug']) {
                error_log('Redis Object Cache: Delete failed - ' . $e->getMessage());
            }
            return false;
        }
    }

    /**
     * Clears the object cache of all data
     *
     * @return bool Always returns true
     */
    public function flush() {
        if (!$this->redis_available) {
            return false;
        }

        try {
            if ($this->redis_config['async_flush']) {
                $this->redis->flushDBAsync();
            } else {
                $this->redis->flushDB();
            }

            $this->cache = array();
            
            return true;
        } catch (Exception $e) {
            if ($this->redis_config['debug']) {
                error_log('Redis Object Cache: Flush failed - ' . $e->getMessage());
            }
            return false;
        }
    }

    /**
     * Retrieves the cache contents, if it exists
     *
     * @param int|string $key   What the contents in the cache are called
     * @param string     $group Optional. Where the cache contents are grouped. Default 'default'.
     * @param bool       $force Optional. Unused. Whether to force an update of the local cache
     *                          from the persistent cache. Default false.
     * @param bool       $found Optional. Whether the key was found in the cache. Disambiguates a
     *                          return of false, a storable value. Passed by reference. Default null.
     * @return false|mixed False on failure to retrieve contents or the cache
     *                      contents on success
     */
    public function get($key, $group = 'default', $force = false, &$found = null) {
        if (empty($group)) {
            $group = 'default';
        }

        $id = $key;
        if ($this->multisite && !isset($this->global_groups[$group])) {
            $id = $this->blog_prefix . ':' . $key;
        }

        $redis_key = $this->build_key($id, $group);

        // Check local cache first
        if (isset($this->cache[$redis_key])) {
            $found = true;
            $this->cache_hits++;
            return $this->cache[$redis_key];
        }

        if (!$this->redis_available) {
            $found = false;
            $this->cache_misses++;
            return false;
        }

        try {
            $value = $this->redis->get($redis_key);
            
            if ($value === false) {
                $found = false;
                $this->cache_misses++;
                return false;
            }

            // Unserialize if needed
            if ($this->redis_config['serializer'] === 'php') {
                $value = maybe_unserialize($value);
            }

            $this->cache[$redis_key] = $value;
            $found = true;
            $this->cache_hits++;
            
            return $value;
        } catch (Exception $e) {
            if ($this->redis_config['debug']) {
                error_log('Redis Object Cache: Get failed - ' . $e->getMessage());
            }
            
            $found = false;
            $this->cache_misses++;
            return false;
        }
    }

    /**
     * Increments numeric cache item's value.
     *
     * @param int|string $key    The cache key to increment
     * @param int        $offset Optional. The amount by which to increment the item's value. Default 1.
     * @param string     $group  Optional. The group the key is in. Default 'default'.
     * @return false|int False on failure, the item's new value on success.
     */
    public function incr($key, $offset = 1, $group = 'default') {
        if (empty($group)) {
            $group = 'default';
        }

        $id = $key;
        if ($this->multisite && !isset($this->global_groups[$group])) {
            $id = $this->blog_prefix . ':' . $key;
        }

        if (!$this->redis_available) {
            return false;
        }

        try {
            $redis_key = $this->build_key($id, $group);
            $value = $this->redis->incrBy($redis_key, $offset);
            
            return $value;
        } catch (Exception $e) {
            if ($this->redis_config['debug']) {
                error_log('Redis Object Cache: Increment failed - ' . $e->getMessage());
            }
            return false;
        }
    }

    /**
     * Replaces the contents of the cache, if contents already exist.
     *
     * @param int|string $key    What to call the contents in the cache
     * @param mixed      $data   The contents to store in the cache
     * @param string     $group  Optional. Where to group the cache contents. Default 'default'.
     * @param int        $expire Optional. When to expire the cache contents. Default 0 (no expiration).
     * @return bool False if not exists, true if contents were replaced
     */
    public function replace($key, $data, $group = 'default', $expire = 0) {
        if (empty($group)) {
            $group = 'default';
        }

        $id = $key;
        if ($this->multisite && !isset($this->global_groups[$group])) {
            $id = $this->blog_prefix . ':' . $key;
        }

        if (!$this->_exists($id, $group)) {
            return false;
        }

        return $this->set($key, $data, $group, $expire);
    }

    /**
     * Sets the data contents into the cache
     *
     * @param int|string $key    What to call the contents in the cache
     * @param mixed      $data   The contents to store in the cache
     * @param string     $group  Optional. Where to group the cache contents. Default 'default'.
     * @param int        $expire Optional. When to expire the cache contents. Default 0 (no expiration).
     * @return bool False if not set, true if set.
     */
    public function set($key, $data, $group = 'default', $expire = 0) {
        if (empty($group)) {
            $group = 'default';
        }

        $id = $key;
        if ($this->multisite && !isset($this->global_groups[$group])) {
            $id = $this->blog_prefix . ':' . $key;
        }

        $redis_key = $this->build_key($id, $group);

        // Store in local cache
        $this->cache[$redis_key] = $data;

        if (!$this->redis_available) {
            return false;
        }

        try {
            $value = $data;
            
            // Serialize if needed
            if ($this->redis_config['serializer'] === 'php') {
                $value = maybe_serialize($value);
            }

            if ($expire > 0) {
                $result = $this->redis->setex($redis_key, $expire, $value);
            } else {
                $result = $this->redis->set($redis_key, $value);
            }

            return $result;
        } catch (Exception $e) {
            if ($this->redis_config['debug']) {
                error_log('Redis Object Cache: Set failed - ' . $e->getMessage());
            }
            return false;
        }
    }

    /**
     * Echoes the stats of the caching.
     *
     * Gives the cache hits, and cache misses. Also prints every cached group,
     * key and the data.
     */
    public function stats() {
        echo "<p>";
        echo "<strong>Cache Hits:</strong> {$this->cache_hits}<br />";
        echo "<strong>Cache Misses:</strong> {$this->cache_misses}<br />";
        echo "<strong>Redis Available:</strong> " . ($this->redis_available ? 'Yes' : 'No') . "<br />";
        echo "</p>";
    }

    /**
     * Switches the internal blog ID.
     *
     * This changes the blog ID used to create keys in blog and user groups.
     *
     * @param int $blog_id Blog ID
     */
    public function switch_to_blog($blog_id) {
        $blog_id = (int) $blog_id;
        $this->blog_prefix = $this->multisite ? $blog_id : 1;
    }

    /**
     * Builds a key for the cache
     *
     * @param string $key  The key
     * @param string $group The group
     * @return string
     */
    private function build_key($key, $group) {
        return $group . ':' . $key;
    }

    /**
     * Checks if a key exists in the cache
     *
     * @param string $key   The key
     * @param string $group The group
     * @return bool
     */
    private function _exists($key, $group) {
        $redis_key = $this->build_key($key, $group);
        
        if (isset($this->cache[$redis_key])) {
            return true;
        }

        if (!$this->redis_available) {
            return false;
        }

        try {
            return $this->redis->exists($redis_key) > 0;
        } catch (Exception $e) {
            if ($this->redis_config['debug']) {
                error_log('Redis Object Cache: Exists check failed - ' . $e->getMessage());
            }
            return false;
        }
    }
}

// Initialize the object cache
global $wp_object_cache;
$wp_object_cache = new WP_Object_Cache();
