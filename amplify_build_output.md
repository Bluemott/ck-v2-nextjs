0

2025-10-08T22:22:34.059Z [INFO]: # Build environment configured with Standard build compute type: 8GiB Memory, 4vCPUs, 128GB Disk Space

1

2025-10-08T22:22:34.545Z [INFO]: # Cloning repository: git@github.com:Bluemott/ck-v2-nextjs.git

2

2025-10-08T22:22:35.950Z [INFO]:

3

2025-10-08T22:22:35.950Z [INFO]: Cloning into 'ck-v2-nextjs'...

4

2025-10-08T22:22:35.951Z [INFO]: # Switching to commit: 11f29bdbdd1833c078975f02aa01e7f60e4f8f5f

5

2025-10-08T22:22:36.064Z [INFO]: Note: switching to '11f29bdbdd1833c078975f02aa01e7f60e4f8f5f'.

6

                                 You are in 'detached HEAD' state. You can look around, make experimental

7

                                 changes and commit them, and you can discard any commits you make in this

8

                                 state without impacting any branches by switching back to a branch.

9

                                 If you want to create a new branch to retain commits you create, you may

10

                                 do so (now or later) by using -c with the switch command. Example:

11

                                 git switch -c <new-branch-name>

12

                                 Or undo this operation with:

13

                                 git switch -

14

                                 Turn off this advice by setting config variable advice.detachedHead to false

15

                                 HEAD is now at 11f29bd Debug: Add verification commands to check required-server-files.json existence

16

2025-10-08T22:22:36.114Z [INFO]: Successfully cleaned up Git credentials

17

2025-10-08T22:22:36.114Z [INFO]: # Checking for Git submodules at: /codebuild/output/src624935537/src/ck-v2-nextjs/.gitmodules

18

2025-10-08T22:22:36.125Z [INFO]: # Retrieving environment cache...

19

2025-10-08T22:22:36.172Z [WARNING]: ! Unable to write cache: {"code":"ERR_BAD_REQUEST","message":"Request failed with status code 404"})}
2025-10-08T22:22:36.173Z [INFO]: ---- Setting Up SSM Secrets ----

21

2025-10-08T22:22:36.173Z [INFO]: SSM params {"Path":"/amplify/d1crrnsi5h4ht1/master/","WithDecryption":true}

22

2025-10-08T22:22:36.226Z [WARNING]: !Failed to set up process.env.secrets

23

2025-10-08T22:22:36.970Z [INFO]: # No package override configuration found.

24

2025-10-08T22:22:36.973Z [INFO]: # Retrieving cache...

25

2025-10-08T22:22:36.974Z [INFO]: # Retrieved cache

26

2025-10-08T22:22:41.953Z [INFO]: ## Starting Backend Build

27

                                 ## Checking for associated backend environment...

28

                                 ## No backend environment association found, continuing...

29

2025-10-08T22:22:41.959Z [INFO]: ## Completed Backend Build

30

                                 {"backendDuration": 0}

31

                                 ## Starting Frontend Build

32

                                 # Starting phase: preBuild

33

                                 # Executing command: echo "Starting Amplify build"

34

                                 Starting Amplify build

35

                                 # Executing command: node --version

36

2025-10-08T22:22:41.961Z [INFO]: v22.18.0

37

2025-10-08T22:22:41.961Z [INFO]: # Executing command: npm --version

38

2025-10-08T22:22:47.279Z [INFO]: 10.9.3

39

2025-10-08T22:22:47.286Z [INFO]: # Executing command: export NODE_ENV=production
40

                                 # Executing command: export NEXT_TELEMETRY_DISABLED=1

41

                                 # Executing command: export NODE_OPTIONS="--max-old-space-size=4096"

42

                                 # Executing command: npm ci --legacy-peer-deps --include=dev

43

2025-10-08T22:23:06.242Z [WARNING]: npm warn deprecated querystring@0.2.0: The querystring API is considered Legacy. new code should use the URLSearchParams API instead.

44

2025-10-08T22:23:20.442Z [INFO]: > ck-v2-nextjs@0.1.0 prepare

45

                                 > husky

46

2025-10-08T22:23:20.517Z [INFO]: added 901 packages, and audited 940 packages in 33s

47

2025-10-08T22:23:20.518Z [INFO]: 223 packages are looking for funding

48

                                 run `npm fund` for details

49

2025-10-08T22:23:20.518Z [INFO]: found 0 vulnerabilities

50

2025-10-08T22:23:20.568Z [INFO]: # Completed phase: preBuild

51

                                 # Starting phase: build

52

                                 # Executing command: echo "Building Next.js application"

53

                                 Building Next.js application

54

                                 # Executing command: npm run build

55

2025-10-08T22:23:20.684Z [INFO]: > ck-v2-nextjs@0.1.0 build

56

                                 > next build

57

2025-10-08T22:23:21.664Z [INFO]: ⚠ No build cache found. Please configure build caching for faster rebuilds. Read more: https://nextjs.org/docs/messages/no-cache

58

2025-10-08T22:23:21.723Z [INFO]: ▲ Next.js 15.5.4

59

2025-10-08T22:23:21.723Z [INFO]: - Experiments (use with caution):
60

                                 · optimizePackageImports

61

2025-10-08T22:23:21.760Z [INFO]: Creating an optimized production build ...

62

2025-10-08T22:23:34.576Z [INFO]: ✓ Compiled successfully in 12.7s

63

2025-10-08T22:23:34.580Z [INFO]: Linting and checking validity of types ...

64

2025-10-08T22:23:45.600Z [INFO]: Collecting page data ...

65

2025-10-08T22:23:46.507Z [WARNING]: Redis not available, falling back to memory cache: Error: connect ECONNREFUSED 127.0.0.1:6379

66

                                    at <unknown> (Error: connect ECONNREFUSED 127.0.0.1:6379) {

67

                                    errno: -111,

68

                                    code: 'ECONNREFUSED',

69

                                    syscall: 'connect',

70

                                    address: '127.0.0.1',

71

                                    port: 6379

72

                                    }

73

2025-10-08T22:23:46.870Z [WARNING]: Redis not available, falling back to memory cache: Error: connect ECONNREFUSED 127.0.0.1:6379

74

                                    at <unknown> (Error: connect ECONNREFUSED 127.0.0.1:6379) {

75

                                    errno: -111,

76

                                    code: 'ECONNREFUSED',

77

                                    syscall: 'connect',

78

                                    address: '127.0.0.1',

79

                                    port: 6379

80

                                    }

81

2025-10-08T22:23:47.098Z [WARNING]: Redis not available, falling back to memory cache: Error: connect ECONNREFUSED 127.0.0.1:6379

82

                                    at <unknown> (Error: connect ECONNREFUSED 127.0.0.1:6379) {

83

                                    errno: -111,

84

                                    code: 'ECONNREFUSED',

85

                                    syscall: 'connect',

86

                                    address: '127.0.0.1',

87

                                    port: 6379

88

                                    }

89

2025-10-08T22:23:47.175Z [WARNING]: Pagination info from headers: {

90

                                    totalPosts: 44,

91

                                    totalPages: 1,

92

                                    currentPage: 1,

93

                                    perPage: 10,

94

                                    'X-WP-Total': '44',

95

                                    'X-WP-TotalPages': '1',

96

                                    'X-WP-Query': null

97

                                    }

98

2025-10-08T22:23:47.175Z [WARNING]: CloudWatch not available, skipping metric

99

2025-10-08T22:23:48.936Z [INFO]: Generating static pages (0/78) ...
100

2025-10-08T22:23:50.094Z [WARNING]: Redis not available, falling back to memory cache: Error: connect ECONNREFUSED 127.0.0.1:6379

101

                                    at <unknown> (Error: connect ECONNREFUSED 127.0.0.1:6379) {

102

                                    errno: -111,

103

                                    code: 'ECONNREFUSED',

104

                                    syscall: 'connect',

105

                                    address: '127.0.0.1',

106

                                    port: 6379

107

                                    }

108

2025-10-08T22:23:50.179Z [WARNING]: CloudWatch not available, skipping metric

109

                                    CloudWatch not available, skipping metric

110

                                    CloudWatch not available, skipping metric

111

2025-10-08T22:23:50.363Z [WARNING]: CloudWatch not available, skipping metric

112

                                    CloudWatch not available, skipping metric

113

                                    CloudWatch not available, skipping metric

114

                                    CloudWatch not available, skipping metric

115

                                    CloudWatch not available, skipping metric

116

                                    CloudWatch not available, skipping metric

117

                                    CloudWatch not available, skipping metric

118

                                    CloudWatch not available, skipping metric

119

                                    CloudWatch not available, skipping metric

120

                                    CloudWatch not available, skipping metric

121

                                    CloudWatch not available, skipping metric

122

                                    CloudWatch not available, skipping metric

123

                                    CloudWatch not available, skipping metric

124

2025-10-08T22:23:50.364Z [WARNING]: Redis not available, falling back to memory cache: Error: connect ECONNREFUSED 127.0.0.1:6379

125

                                    at <unknown> (Error: connect ECONNREFUSED 127.0.0.1:6379) {

126

                                    errno: -111,

127

                                    code: 'ECONNREFUSED',

128

                                    syscall: 'connect',

129

                                    address: '127.0.0.1',

130

                                    port: 6379

131

                                    }

132

2025-10-08T22:23:50.365Z [INFO]: Generating static pages (19/78)

133

2025-10-08T22:23:50.696Z [WARNING]: Pagination info from headers: {

134

                                    totalPosts: 44,

135

                                    totalPages: 1,

136

                                    currentPage: 1,

137

                                    perPage: 10,

138

                                    'X-WP-Total': '44',

139

                                    'X-WP-TotalPages': '1',

140

                                    'X-WP-Query': null

141

                                    }

142

                                    CloudWatch not available, skipping metric

143

2025-10-08T22:23:51.242Z [WARNING]: Redis not available, falling back to memory cache: Error: connect ECONNREFUSED 127.0.0.1:6379

144

                                    at <unknown> (Error: connect ECONNREFUSED 127.0.0.1:6379) {

145

                                    errno: -111,

146

                                    code: 'ECONNREFUSED',

147

                                    syscall: 'connect',

148

                                    address: '127.0.0.1',

149

                                    port: 6379

150

                                    }

151

                                    Redis not available, falling back to memory cache: Error: connect ECONNREFUSED 127.0.0.1:6379

152

                                    at <unknown> (Error: connect ECONNREFUSED 127.0.0.1:6379) {

153

                                    errno: -111,

154

                                    code: 'ECONNREFUSED',

155

                                    syscall: 'connect',

156

                                    address: '127.0.0.1',

157

                                    port: 6379

158

                                    }

159

2025-10-08T22:23:51.344Z [WARNING]: Pagination info from headers: {

160

                                    totalPosts: 44,

161

                                    totalPages: 9,

162

                                    currentPage: 1,

163

                                    perPage: 10,

164

                                    'X-WP-Total': '44',

165

                                    'X-WP-TotalPages': '9',

166

                                    'X-WP-Query': null

167

                                    }

168

                                    CloudWatch not available, skipping metric

169

2025-10-08T22:23:51.546Z [WARNING]: Pagination info from headers: {

170

                                    totalPosts: 44,

171

                                    totalPages: 1,

172

                                    currentPage: 1,

173

                                    perPage: 10,

174

                                    'X-WP-Total': '44',

175

                                    'X-WP-TotalPages': '1',

176

                                    'X-WP-Query': null

177

                                    }

178

                                    CloudWatch not available, skipping metric

179

                                    CloudWatch not available, skipping metric

180

                                    CloudWatch not available, skipping metric

181

2025-10-08T22:23:51.655Z [WARNING]: CloudWatch not available, skipping metric

182

                                    CloudWatch not available, skipping metric

183

                                    CloudWatch not available, skipping metric

184

                                    CloudWatch not available, skipping metric

185

                                    CloudWatch not available, skipping metric

186

                                    CloudWatch not available, skipping metric

187

                                    CloudWatch not available, skipping metric

188

                                    CloudWatch not available, skipping metric

189

                                    CloudWatch not available, skipping metric

190

                                    CloudWatch not available, skipping metric

191

                                    CloudWatch not available, skipping metric

192

                                    CloudWatch not available, skipping metric

193

                                    CloudWatch not available, skipping metric

194

                                    CloudWatch not available, skipping metric

195

                                    CloudWatch not available, skipping metric

196

                                    CloudWatch not available, skipping metric

197

2025-10-08T22:23:51.665Z [WARNING]: Redis not available, falling back to memory cache: Error: connect ECONNREFUSED 127.0.0.1:6379

198

                                    at <unknown> (Error: connect ECONNREFUSED 127.0.0.1:6379) {

199

                                    errno: -111,

200

                                    code: 'ECONNREFUSED',

201

                                    syscall: 'connect',

202

                                    address: '127.0.0.1',

203

                                    port: 6379

204

                                    }

205

2025-10-08T22:23:52.143Z [WARNING]: Pagination info from headers: {

206

                                    totalPosts: 44,

207

                                    totalPages: 1,

208

                                    currentPage: 1,

209

                                    perPage: 10,

210

                                    'X-WP-Total': '44',

211

                                    'X-WP-TotalPages': '1',

212

                                    'X-WP-Query': null

213

                                    }

214

                                    CloudWatch not available, skipping metric

215

                                    Pagination info from headers: {

216

                                    totalPosts: 44,

217

                                    totalPages: 1,

218

                                    currentPage: 1,

219

                                    perPage: 10,

220

                                    'X-WP-Total': '44',

221

                                    'X-WP-TotalPages': '1',

222

                                    'X-WP-Query': null

223

                                    }

224

                                    CloudWatch not available, skipping metric

225

                                    Pagination info from headers: {

226

                                    totalPosts: 44,

227

                                    totalPages: 1,

228

                                    currentPage: 1,

229

                                    perPage: 10,

230

                                    'X-WP-Total': '44',

231

                                    'X-WP-TotalPages': '1',

232

                                    'X-WP-Query': null

233

                                    }

234

                                    CloudWatch not available, skipping metric

235

                                    Pagination info from headers: {

236

                                    totalPosts: 44,

237

                                    totalPages: 1,

238

                                    currentPage: 1,

239

                                    perPage: 10,

240

                                    'X-WP-Total': '44',

241

                                    'X-WP-TotalPages': '1',

433

                                    CloudWatch not available, skipping metric

434

2025-10-08T22:23:52.999Z [WARNING]: CloudWatch not available, skipping metric

435

2025-10-08T22:23:53.155Z [WARNING]: CloudWatch not available, skipping metric

436

                                    CloudWatch not available, skipping metric

437

                                    CloudWatch not available, skipping metric

438

                                    CloudWatch not available, skipping metric

439

                                    CloudWatch not available, skipping metric

440

                                    CloudWatch not available, skipping metric

441

2025-10-08T22:23:53.193Z [INFO]: ✓ Generating static pages (78/78)

442

2025-10-08T22:23:53.968Z [INFO]: Finalizing page optimization ...

443

                                 Collecting build traces ...

444

2025-10-08T22:24:19.427Z [INFO]:

445

2025-10-08T22:24:19.441Z [INFO]: Route (app) Size First Load JS
446

                                 ┌ ○ /                                                    2.08 kB         263 kB

447

                                 ├ ○ /_not-found                                            114 B         261 kB

448

                                 ├ ○ /about                                                 114 B         261 kB

449

                                 ├ ○ /admin                                                 114 B         261 kB

450

                                 ├ ƒ /api/analytics/web-vitals                              113 B         261 kB

451

                                 ├ ƒ /api/categories                                        114 B         261 kB

452

                                 ├ ƒ /api/docs                                              114 B         261 kB

453

                                 ├ ƒ /api/downloads                                         114 B         261 kB

454

                                 ├ ƒ /api/env-test                                          114 B         261 kB

455

                                 ├ ƒ /api/health                                            114 B         261 kB

456

                                 ├ ƒ /api/health-simple                                     114 B         261 kB

457

                                 ├ ƒ /api/indexnow                                          114 B         261 kB

458

                                 ├ ƒ /api/media/upload                                      114 B         261 kB

459

                                 ├ ƒ /api/middleware-test                                   114 B         261 kB

460

                                 ├ ƒ /api/minimal-test                                      114 B         261 kB

461

                                 ├ ƒ /api/posts                                             114 B         261 kB

462

                                 ├ ƒ /api/posts-simple                                      114 B         261 kB

463

                                 ├ ƒ /api/posts/[slug]                                      114 B         261 kB

464

                                 ├ ƒ /api/recommendations                                   114 B         261 kB

465

                                 ├ ƒ /api/search                                            114 B         261 kB

466

                                 ├ ƒ /api/shop/etsy                                         114 B         261 kB

467

                                 ├ ƒ /api/tags                                              114 B         261 kB

468

                                 ├ ƒ /api/test                                              114 B         261 kB

469

                                 ├ ƒ /api/test-downloads                                    114 B         261 kB

470

                                 ├ ƒ /api/wordpress-webhook                                 114 B         261 kB

471

                                 ├ ○ /blog                                                  168 B         261 kB

472

                                 ├ ● /blog/[slug]                                         5.71 kB         267 kB

473

                                 ├   ├ /blog/diy-fish-ornaments-recycled-paper

474

                                 ├   ├ /blog/diy-hand-painted-upholstery-sunburst-chairs

475

                                 ├   ├ /blog/shell-yeah-my-trees-still-up

476

                                 ├   └ [+41 more paths]

477

                                 ├ ƒ /blog/category/[slug]                                  114 B         261 kB

478

                                 ├ ƒ /blog/tag/[slug]                                       114 B         261 kB

479

                                 ├ ○ /custom-kimonos                                        113 B         261 kB

480

                                 ├ ○ /downloads                                           3.54 kB         264 kB

481

                                 ├ ƒ /feed.xml                                              114 B         261 kB

482

                                 ├ ○ /manifest.webmanifest                                  114 B         261 kB

483

                                 ├ ○ /robots.txt                                            114 B         261 kB

484

                                 ├ ○ /shop                                                1.65 kB         263 kB

485

                                 ├ ○ /sitemap.xml                                           114 B         261 kB

486

                                 └ ○ /test-thumbnails                                       156 B         261 kB

487

                                 + First Load JS shared by all                             261 kB

488

                                 ├ chunks/common-ff243a033a19e7fb.js                    11.1 kB

489

                                 └ chunks/vendors-42f051adf61433d8.js                    248 kB

490

                                 └ other shared chunks (total)                          1.91 kB

491

                                 ƒ Middleware                                             40.7 kB

492

                                 ○  (Static)   prerendered as static content

493

                                 ●  (SSG)      prerendered as static HTML (uses generateStaticParams)

494

                                 ƒ  (Dynamic)  server-rendered on demand

495

2025-10-08T22:24:19.499Z [INFO]: # Executing command: echo "Verifying build output"

496

                                 Verifying build output

497

2025-10-08T22:24:19.499Z [INFO]: # Executing command: ls -la .next/

498

2025-10-08T22:24:19.501Z [INFO]: total 1032

499

                                 drwxr-xr-x  8 amplify amplify   4096 Oct  8 22:24 .

500

                                 drwxr-xr-x 14 amplify amplify   4096 Oct  8 22:23 ..

501

                                 -rw-r--r--  1 amplify amplify     21 Oct  8 22:23 BUILD_ID

502

                                 -rw-r--r--  1 amplify amplify  12499 Oct  8 22:23 app-build-manifest.json

503

                                 -rw-r--r--  1 amplify amplify   1575 Oct  8 22:23 app-path-routes-manifest.json

504

                                 -rw-r--r--  1 amplify amplify   1093 Oct  8 22:23 build-manifest.json

505

                                 drwxr-xr-x  6 amplify amplify     85 Oct  8 22:23 cache

506

                                 drwxr-xr-x  2 amplify amplify     58 Oct  8 22:23 diagnostics

507

                                 -rw-r--r--  1 amplify amplify    111 Oct  8 22:23 export-marker.json

508

                                 -rw-r--r--  1 amplify amplify   2641 Oct  8 22:23 images-manifest.json

509

                                 -rw-r--r--  1 amplify amplify   7772 Oct  8 22:24 next-minimal-server.js.nft.json

510

                                 -rw-r--r--  1 amplify amplify 125376 Oct  8 22:24 next-server.js.nft.json

511

                                 -rw-r--r--  1 amplify amplify     20 Oct  8 22:23 package.json

512

                                 -rw-r--r--  1 amplify amplify  38285 Oct  8 22:23 prerender-manifest.json

513

                                 -rw-r--r--  1 amplify amplify      2 Oct  8 22:23 react-loadable-manifest.json

514

                                 -rw-r--r--  1 amplify amplify  10869 Oct  8 22:23 required-server-files.json

515

                                 -rw-r--r--  1 amplify amplify   5627 Oct  8 22:23 routes-manifest.json

516

                                 drwxr-xr-x  5 amplify amplify   4096 Oct  8 22:23 server

517

                                 drwxr-xr-x  4 amplify amplify     76 Oct  8 22:24 standalone

518

                                 drwxr-xr-x  6 amplify amplify     73 Oct  8 22:23 static

519

                                 -rw-r--r--  1 amplify amplify 800805 Oct  8 22:24 trace

520

                                 drwxr-xr-x  3 amplify amplify     99 Oct  8 22:23 types

521

2025-10-08T22:24:19.501Z [INFO]: # Executing command: test -f .next/required-server-files.json && echo "required-server-files.json exists" || echo "ERROR required-server-files.json NOT FOUND"

522

2025-10-08T22:24:19.501Z [INFO]: required-server-files.json exists

523

                                 # Executing command: cat .next/required-server-files.json

524

2025-10-08T22:24:19.503Z [INFO]: {

525

                                 "version": 1,

526

                                 "config": {

527

                                 "env": {},

528

                                 "eslint": {

529

                                 "ignoreDuringBuilds": false

530

                                 },

531

                                 "typescript": {

532

                                 "ignoreBuildErrors": false,

533

                                 "tsconfigPath": "tsconfig.json"

534

                                 },

535

                                 "typedRoutes": false,

536

                                 "distDir": ".next",

537

                                 "cleanDistDir": true,

538

                                 "assetPrefix": "",

539

                                 "cacheMaxMemorySize": 52428800,

540

                                 "configOrigin": "next.config.ts",

541

                                 "useFileSystemPublicRoutes": true,

542

                                 "generateEtags": true,

543

                                 "pageExtensions": [

544

                                 "tsx",

545

                                 "ts",

546

                                 "jsx",

547

                                 "js"

548

                                 ],

549

                                 "poweredByHeader": false,

550

                                 "compress": true,

551

                                 "images": {

552

                                 "deviceSizes": [

553

                                 640,

554

                                 750,

555

                                 828,

556

                                 1080,

557

                                 1200,

558

                                 1920,

559

                                 2048,

560

                                 3840

561

                                 ],

562

                                 "imageSizes": [

563

                                 16,

564

                                 32,

565

                                 48,

566

                                 64,

567

                                 96,

568

                                 128,

569

                                 256,

570

                                 384

571

                                 ],

572

                                 "path": "/_next/image",

573

                                 "loader": "default",

574

                                 "loaderFile": "",

575

                                 "domains": [],

576

                                 "disableStaticImages": false,

577

                                 "minimumCacheTTL": 2592000,

578

                                 "formats": [

579

                                 "image/webp",

580

                                 "image/avif"

581

                                 ],

582

                                 "dangerouslyAllowSVG": true,

583

                                 "contentSecurityPolicy": "default-src 'self'; script-src 'none'; sandbox;",

584

                                 "contentDispositionType": "attachment",

585

                                 "remotePatterns": [

586

                                 {

587

                                 "protocol": "http",

588

                                 "hostname": "localhost",

589

                                 "port": "3000",

590

                                 "pathname": "/**"

591

                                 },

592

                                 {

593

                                 "protocol": "https",

594

                                 "hostname": "cowboykimono.com",

595

                                 "port": "",

596

                                 "pathname": "/**"

597

                                 },

598

                                 {

599

                                 "protocol": "https",

600

                                 "hostname": "api.cowboykimono.com",

601

                                 "port": "",

602

                                 "pathname": "/**"

603

                                 },

604

                                 {

605

                                 "protocol": "https",

606

                                 "hostname": "admin.cowboykimono.com",

607

                                 "port": "",

608

                                 "pathname": "/**"

609

                                 },

610

                                 590

                                 "pathname": "/**"

591

                                 },

592

                                 {

593

                                 "protocol": "https",

594

                                 "hostname": "cowboykimono.com",

595

                                 "port": "",

596

                                 "pathname": "/**"

597

                                 },

598

                                 {

599

                                 "protocol": "https",

600

                                 "hostname": "api.cowboykimono.com",

601

                                 "port": "",

602

                                 "pathname": "/**"

603

                                 },

604

                                 {

605

                                 "protocol": "https",

606

                                 "hostname": "admin.cowboykimono.com",

607

                                 "port": "",

608

                                 "pathname": "/**"

609

                                 },

610
591

                                 },

592

                                 {

593

                                 "protocol": "https",

594

                                 "hostname": "cowboykimono.com",

595

                                 "port": "",

596

                                 "pathname": "/**"

597

                                 },

598

                                 {

599

                                 "protocol": "https",

600

                                 "hostname": "api.cowboykimono.com",

601

                                 "port": "",

602

                                 "pathname": "/**"

603

                                 },

604

                                 {

605

                                 "protocol": "https",

606

                                 "hostname": "admin.cowboykimono.com",

607

                                 "port": "",

608

                                 "pathname": "/**"

609

                                 },

611

                                 "protocol": "https",

612

                                 "hostname": "i.etsystatic.com",

613

                                 "port": "",

614

                                 "pathname": "/**"

615

                                 },

616

                                 {

617

                                 "protocol": "https",

618

                                 "hostname": "img.etsystatic.com",

619

                                 "port": "",

620

                                 "pathname": "/**"

621

                                 },

622

                                 {

623

                                 "protocol": "https",

624

                                 "hostname": "v5.airtableusercontent.com",

625

                                 "port": "",

626

                                 "pathname": "/**"

627

                                 },

628

                                 {

629

                                 "protocol": "https",

630

                                 "hostname": "images.unsplash.com",

631

                                 "port": "",

632

                                 "pathname": "/**"

633

                                 }

634

                                 ],

635

                                 "unoptimized": false

636

                                 },

637

                                 "devIndicators": {

638

                                 "position": "bottom-left"

639

                                 },

640

                                 "onDemandEntries": {

641

                                 "maxInactiveAge": 60000,

642

                                 "pagesBufferLength": 5

643

                                 },

644

                                 "amp": {

645

                                 "canonicalBase": ""

646

                                 },

647

                                 "basePath": "",

648

                                 "sassOptions": {},

649

                                 "trailingSlash": false,

650

                                 "i18n": null,

651

                                 "productionBrowserSourceMaps": false,

652

                                 "excludeDefaultMomentLocales": true,

653

                                 "serverRuntimeConfig": {},

654

                                 "publicRuntimeConfig": {},

655

                                 "reactProductionProfiling": false,

656

                                 "reactStrictMode": true,

657

                                 "reactMaxHeadersLength": 6000,

658

                                 "httpAgentOptions": {

659

                                 "keepAlive": true

660

                                 },

661

                                 "logging": {},

662

                                 "compiler": {},

663

                                 "expireTime": 31536000,

664

                                 "staticPageGenerationTimeout": 60,

665

                                 "output": "standalone",

666

                                 "modularizeImports": {

667

                                 "@mui/icons-material": {

668

                                 "transform": "@mui/icons-material/{{member}}"

669

                                 },

670

                                 "lodash": {

671

                                 "transform": "lodash/{{member}}"

672

                                 }

673

                                 },

674

                                 "outputFileTracingRoot": "/codebuild/output/src624935537/src/ck-v2-nextjs",

675

                                 "experimental": {

676

                                 "useSkewCookie": false,

677

                                 "cacheLife": {

678

                                 "default": {

679

                                 "stale": 300,

680

                                 "revalidate": 900,

681

                                 "expire": 4294967294

682

                                 },

683

                                 "seconds": {

684

                                 "stale": 30,

685

                                 "revalidate": 1,

686

                                 "expire": 60

687

                                 },

688

                                 "minutes": {

689

                                 "stale": 300,

690

                                 "revalidate": 60,

691

                                 "expire": 3600

692

                                 },

693

                                 "hours": {

694

                                 "stale": 300,

695

                                 "revalidate": 3600,

696

                                 "expire": 86400

697

                                 },

698

                                 "days": {

699

                                 "stale": 300,

700

                                 "revalidate": 86400,

701

                                 "expire": 604800

702

                                 },

703

                                 "weeks": {

704

                                 "stale": 300,

705

                                 "revalidate": 604800,

706

                                 "expire": 2592000

707

                                 },

708

                                 "max": {

709

                                 "stale": 300,

710

                                 "revalidate": 2592000,

711

                                 "expire": 4294967294

712

                                 }

713

                                 },

714

                                 "cacheHandlers": {},

715

                                 "cssChunking": true,

716

                                 "multiZoneDraftMode": false,

717

                                 "appNavFailHandling": false,

718

                                 "prerenderEarlyExit": true,

719

                                 "serverMinification": true,

720

                                 "serverSourceMaps": false,

721

                                 "linkNoTouchStart": false,

722

                                 "caseSensitiveRoutes": false,

723

                                 "clientSegmentCache": false,

724

                                 "clientParamParsing": false,

725

                                 "dynamicOnHover": false,

726

                                 "preloadEntriesOnStart": true,

727

                                 "clientRouterFilter": true,

728

                                 "clientRouterFilterRedirects": false,

729

                                 "fetchCacheKeyPrefix": "",

730

                                 "middlewarePrefetch": "flexible",

731

                                 "optimisticClientCache": true,

732

                                 "manualClientBasePath": false,

733

                                 "cpus": 3,

734

                                 "memoryBasedWorkersCount": false,

735

                                 "imgOptConcurrency": null,

736

                                 "imgOptTimeoutInSeconds": 7,

737

                                 "imgOptMaxInputPixels": 268402689,

738

                                 "imgOptSequentialRead": null,

739

                                 "imgOptSkipMetadata": null,

740

                                 "isrFlushToDisk": true,

741

                                 "workerThreads": false,

742

                                 "optimizeCss": false,

743

                                 "nextScriptWorkers": false,

744

                                 "scrollRestoration": false,

745

                                 "externalDir": false,

746

                                 "disableOptimizedLoading": false,

747

                                 "gzipSize": true,

748

                                 "craCompat": false,

749

                                 "esmExternals": true,

750

                                 "fullySpecified": false,

751

                                 "swcTraceProfiling": false,

752

                                 "forceSwcTransforms": false,

753

                                 "largePageDataBytes": 128000,

754

                                 "typedEnv": false,

755

                                 "parallelServerCompiles": false,

756

                                 "parallelServerBuildTraces": false,

757

                                 "ppr": false,

758

                                 "authInterrupts": false,

759

                                 "webpackMemoryOptimizations": false,

760

                                 "optimizeServerReact": true,

761

                                 "viewTransition": false,

762

                                 "routerBFCache": false,

763

                                 "removeUncaughtErrorAndRejectionListeners": false,

764

                                 "validateRSCRequestHeaders": false,

765

                                 "staleTimes": {

766

                                 "dynamic": 0,

767

                                 "static": 300

768

                                 },

769

                                 "serverComponentsHmrCache": true,

770

                                 "staticGenerationMaxConcurrency": 8,

771

                                 "staticGenerationMinPagesPerWorker": 25,

772

                                 "cacheComponents": false,

773

                                 "inlineCss": false,

774

                                 "useCache": false,

775

                                 "globalNotFound": false,

776

                                 "devtoolSegmentExplorer": true,

777

                                 "browserDebugInfoInTerminal": false,

778

                                 "optimizeRouterScrolling": false,

779

                                 "optimizePackageImports": [

780

                                 "@next/font",

781

                                 "lucide-react",

782

                                 "date-fns",

783

                                 "lodash-es",

784

                                 "ramda",

785

                                 "antd",

786

                                 "react-bootstrap",

787

                                 "ahooks",

788

                                 "@ant-design/icons",

789

                                 "@headlessui/react",

790

                                 "@headlessui-float/react",

791

                                 "@heroicons/react/20/solid",

792

                                 "@heroicons/react/24/solid",

793

                                 "@heroicons/react/24/outline",

794

                                 "@visx/visx",

795

                                 "@tremor/react",

796

                                 "rxjs",

797

                                 "@mui/material",

798

                                 "@mui/icons-material",

799

                                 "recharts",

800

                                 "react-use",

801

                                 "effect",

802

                                 "@effect/schema",

803

                                 "@effect/platform",

804

                                 "@effect/platform-node",

805

                                 "@effect/platform-browser",

806

                                 "@effect/platform-bun",

807

                                 "@effect/sql",

808

                                 "@effect/sql-mssql",

809

                                 "@effect/sql-mysql2",

810

                                 "@effect/sql-pg",

811

                                 "@effect/sql-sqlite-node",

812

                                 "@effect/sql-sqlite-bun",

813

                                 "@effect/sql-sqlite-wasm",

814

                                 "@effect/sql-sqlite-react-native",

815

                                 "@effect/rpc",

816

                                 "@effect/rpc-http",

817

                                 "@effect/typeclass",

818

                                 "@effect/experimental",

819

                                 "@effect/opentelemetry",

820

                                 "@material-ui/core",

821

                                 "@material-ui/icons",

822

                                 "@tabler/icons-react",

823

                                 "mui-core",

824

                                 "react-icons/ai",

825

                                 "react-icons/bi",

826

                                 "react-icons/bs",

827

                                 "react-icons/cg",

828

                                 "react-icons/ci",

829

                                 "react-icons/di",

830

                                 "react-icons/fa",

831

                                 "react-icons/fa6",

832

                                 "react-icons/fc",

833

                                 "react-icons/fi",

834

                                 "react-icons/gi",

835

                                 "react-icons/go",

836

                                 "react-icons/gr",

837

                                 "react-icons/hi",

838

                                 "react-icons/hi2",

839

                                 "react-icons/im",

840

                                 "react-icons/io",

841

                                 "react-icons/io5",

842

                                 "react-icons/lia",

843

                                 "react-icons/lib",

844

                                 "react-icons/lu",

845

                                 "react-icons/md",

846

                                 "react-icons/pi",

847

                                 "react-icons/ri",

848

                                 "react-icons/rx",

849

                                 "react-icons/si",

850

                                 "react-icons/sl",

851

                                 "react-icons/tb",

852

                                 "react-icons/tfi",

853

                                 "react-icons/ti",

854

                                 "react-icons/vsc",

855

                                 "react-icons/wi"

856

                                 ],

857

                                 "trustHostHeader": false,

858

                                 "isExperimentalCompile": false

859

                                 },

860

                                 "htmlLimitedBots": "[\\w-]+-Google|Google-[\\w-]+|Chrome-Lighthouse|Slurp|DuckDuckBot|baiduspider|yandex|sogou|bitlybot|tumblr|vkShare|quora link preview|redditbot|ia_archiver|Bingbot|BingPreview|applebot|facebookexternalhit|facebookcatalog|Twitterbot|LinkedInBot|Slackbot|Discordbot|WhatsApp|SkypeUriPreview|Yeti|googleweblight",

861

                                 "bundlePagesRouterDependencies": false,

862

                                 "configFileName": "next.config.ts",

863

                                 "serverExternalPackages": [

864

                                 "@aws-sdk/client-cloudwatch",

865

                                 "@aws-sdk/client-cloudwatch-logs",

866

                                 "@aws-sdk/client-xray",

867

                                 "@aws-sdk/client-s3",

868

                                 "@aws-sdk/client-rds-data"

869

                                 ],

870

                                 "turbopack": {

871

                                 "root": "/codebuild/output/src624935537/src/ck-v2-nextjs"

872

                                 },

873

                                 "_originalRedirects": [

874

                                 {

875

                                 "source": "/:path*",

876

                                 "destination": "https://cowboykimono.com/:path*",

877

                                 "permanent": true,

878

                                 "has": [

879

                                 {

880

                                 "type": "host",

881

                                 "key": "host",

882

                                 "value": "www.cowboykimono.com"

883

                                 }

884

                                 ]

885

                                 },

886

                                 {

887

                                 "source": "/blog/how-to-create-a-hip-jackalope-display",

888

                                 "destination": "/blog/jackalope-garden-display-diy",

889

                                 "permanent": true

890

                                 }

891

                                 ]

893

                                 "appDir": "/codebuild/output/src624935537/src/ck-v2-nextjs",

894

                                 "relativeAppDir": "",

895

                                 "files": [

896

                                 ".next/routes-manifest.json",

897

                                 ".next/server/pages-manifest.json",

898

                                 ".next/build-manifest.json",

899

                                 ".next/prerender-manifest.json",

900

                                 ".next/server/functions-config-manifest.json",

901

                                 ".next/server/middleware-manifest.json",

902

                                 ".next/server/middleware-build-manifest.js",

903

                                 ".next/server/middleware-react-loadable-manifest.js",

904

                                 ".next/react-loadable-manifest.json",

905

                                 ".next/server/app-paths-manifest.json",

906

                                 ".next/app-path-routes-manifest.json",

907

                                 ".next/app-build-manifest.json",

908

                                 ".next/server/server-reference-manifest.js",

909

                                 ".next/server/server-reference-manifest.json",

910

                                 ".next/BUILD_ID",

911

                                 ".next/server/next-font-manifest.js",

912

                                 ".next/server/next-font-manifest.json",

913

                                 ".next/required-server-files.json"

914

                                 ],

915

                                 "ignore": [

916

                                 "node_modules/next/dist/compiled/@ampproject/toolbox-optimizer/**/*"

917

                                 ]

918

                                 }

919

2025-10-08T22:24:19.504Z [INFO]: # Executing command: echo "Build complete"

920

                                 Build complete

921

                                 # Completed phase: build

922

                                 ## Completed Frontend Build

923

2025-10-08T22:24:19.527Z [INFO]: ## Build completed successfully

924

2025-10-08T22:24:19.530Z [INFO]: Found customHttp.yml, applying custom headers...

925

2025-10-08T22:24:19.530Z [INFO]: # Found custom headers config file.

926

2025-10-08T22:24:19.627Z [ERROR]: !!! CustomerError: Can't find required-server-files.json in build output directory

927

2025-10-08T22:24:19.627Z [INFO]: # Starting environment caching...

928

2025-10-08T22:24:19.627Z [INFO]: # Environment caching completed

929

930
