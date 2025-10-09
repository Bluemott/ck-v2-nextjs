0

2025-10-09T10:59:07.533Z [INFO]: # Build environment configured with Standard build compute type: 8GiB Memory, 4vCPUs, 128GB Disk Space

1

2025-10-09T10:59:08.055Z [INFO]: # Cloning repository: git@github.com:Bluemott/ck-v2-nextjs.git

2

2025-10-09T10:59:09.393Z [INFO]:

3

2025-10-09T10:59:09.393Z [INFO]: Cloning into 'ck-v2-nextjs'...

4

2025-10-09T10:59:09.394Z [INFO]: # Switching to commit: 7eec3a40b936f6b5060644134a499b4ee865a72b

5

2025-10-09T10:59:09.511Z [INFO]: Note: switching to '7eec3a40b936f6b5060644134a499b4ee865a72b'.

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

                                 HEAD is now at 7eec3a4 errors with string conversion.

16

2025-10-09T10:59:09.550Z [INFO]: Successfully cleaned up Git credentials

17

2025-10-09T10:59:09.550Z [INFO]: # Checking for Git submodules at: /codebuild/output/src1851502043/src/ck-v2-nextjs/.gitmodules

18

2025-10-09T10:59:09.558Z [INFO]: # Retrieving environment cache...

19

2025-10-09T10:59:09.624Z [WARNING]: ! Unable to write cache: {"code":"ERR_BAD_REQUEST","message":"Request failed with status code 404"})}

20

2025-10-09T10:59:09.624Z [INFO]: ---- Setting Up SSM Secrets ----

21

2025-10-09T10:59:09.624Z [INFO]: SSM params {"Path":"/amplify/d1crrnsi5h4ht1/master/","WithDecryption":true}

22

2025-10-09T10:59:09.673Z [WARNING]: !Failed to set up process.env.secrets

23

2025-10-09T10:59:10.399Z [INFO]: # No package override configuration found.

24

2025-10-09T10:59:10.403Z [INFO]: # Retrieving cache...

25

2025-10-09T10:59:28.587Z [INFO]: # Extracting cache...

26

2025-10-09T10:59:41.934Z [INFO]: # Extraction completed

27

2025-10-09T10:59:42.178Z [INFO]: # Retrieved cache

28

2025-10-09T10:59:46.280Z [INFO]: ## Starting Backend Build

29

                                 ## Checking for associated backend environment...

30

                                 ## No backend environment association found, continuing...

31

                                 ## Completed Backend Build

32

2025-10-09T10:59:46.287Z [INFO]: ## Starting Frontend Build

33

                                 # Starting phase: preBuild

34

2025-10-09T10:59:46.287Z [INFO]: # Executing command: npm ci --legacy-peer-deps --include=dev

35

2025-10-09T11:00:09.972Z [WARNING]: npm warn deprecated querystring@0.2.0: The querystring API is considered Legacy. new code should use the URLSearchParams API instead.

36

2025-10-09T11:00:24.624Z [INFO]: > ck-v2-nextjs@0.1.0 prepare

37

                                 > husky

38

2025-10-09T11:00:24.685Z [INFO]: added 901 packages, and audited 940 packages in 34s

39

2025-10-09T11:00:24.685Z [INFO]: 223 packages are looking for funding
