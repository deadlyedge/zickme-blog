---
slug: second-post
image: ../images/meFace_bigEyeball.jpg
tags:
  - Prisma
  - about
  - feelings
title: 我的第二篇文章
date: "2025-12-08"
---

# mongodb

这边总结一下以replicaSet方式安装mongodb的方法，还挺烧脑的我就不拽英文了。
## 第一步 deploy一个mongodb：
  
首先创建一个网络和一个存储：

```bash
docker network create mongo-cluster

docker volume create mongodb-data
```

之所以要提前创建，主要是为了数据持久化，还有添加keyfile之类的操作，如果没有持久化的存储，那重新构建容器就会丢失认证文件了。

然后使用docker compose：

```yaml
version: '3.8'
services:
  mongo:

    image: mongo:latest

    container_name: mongodb

    hostname: mongodb

    restart: unless-stopped

    environment:

      MONGO_INITDB_ROOT_USERNAME: <username>

      MONGO_INITDB_ROOT_PASSWORD: <password>

      MONGO_REPLICA_SET_NAME: rs0

    volumes:

      - mongodb-data:/data

    ports:

      - 57017:27017

    networks:

      - mongo-cluster

    # healthcheck:

    #   test: echo "try { rs.status() } catch (err) { rs.initiate({_id:'rs0',members:[{_id:0,host:'mongodb'}]}) }" | mongosh --port 27017 --quiet

    #   interval: 10s

    #   timeout: 30s

    #   start_period: 0s

    #   start_interval: 1s

    #   retries: 30

    # command: 'mongod --replSet rs0 --bind_ip localhost,mongo --keyFile /data/keyfile'

  

volumes:

  mongodb-data:

    external: true

  

networks:

  mongo-cluster:

  

```

第一次运行时请一定保持上面注释掉的部分，在我的实际部署中，我试用了几种网络上查到的方法，都无法一次部署成功。所以需要部署两次，第二次部署的时候的时候再使用全部的healthcheck和keyfile认证。

```yaml
services:

  mongo:
    image: mongo:latest
    container_name: mongodb
    hostname: mongodb
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: xdream
      MONGO_INITDB_ROOT_PASSWORD: sima5654
      MONGO_REPLICA_SET_NAME: rs0
    volumes:
      - $PWD/DBdata:/data/db
      - $PWD/mongod.conf:/etc/mongod.conf
      - $PWD/mongodb-keyfile:/data/mongodb-keyfile
    networks:
      macnet:
        ipv4_address: 192.168.50.17
    #healthcheck:
    #  test: test $$(echo "rs.initiate().ok || rs.status().ok" | mongosh -u xdream -p sima5654 --quiet)
    #  interval: 60s
    #  timeout: 30s
    #  retries: 5
    #  start_period: 30s
    #command: "mongod --bind_ip_all --replSet rs0 --keyFile /data/mongodb-keyfile"
    healthcheck:
      test: echo "try { rs.status() } catch (err) { rs.initiate({_id:'rs0',members:[{_id:0,host:'mongodb'}]}) }" | mongosh -u xdream -p sima5654 --quiet
      interval: 10s
      timeout: 30s
      start_period: 0s
      start_interval: 1s
      retries: 30
    command: 'mongod --replSet rs0 --bind_ip_all --keyFile /data/mongodb-keyfile'

networks:
  macnet:
    external: true
    name: macnet

```

## 第二步：升级mongodb到replicaSet

  

第一步成功后，运行如下命令进入容器：

  

```bash

docker exec -it mongodb bash

```

  

创建一个keyfile：

  

```bash

cd /data

openssl rand -base64 756 > keyfile

chown mongodb:mongodb keyfile && chmod 400 keyfile

ls -la

  

# should be like below

...

drwxr-xr-x 2 mongodb mongodb 4096 Jan 17 03:47 configdb

drwxr-xr-x 5 mongodb mongodb 4096 Jan 20 15:17 db

-r-------- 1 mongodb mongodb 1024 Jan 20 15:17 keyfile

...

```

  

然后使用之前docker-compose.yml中设定的用户名和密码运行mongo命令如下：

  

```bash

mongosh -u <username> -p <password>

```

  

接下来如果出现 `rs0 [direct:xxxx] test>` 时，使用如下命令：

  

```bash

test> use admin

# switched to db admin

  

admin> rs.initiate({_id:"rs0", members:[{_id:0,host:"mongodb"}]})

# { ok: 1 }

```

  

此后如果重新进入mongosh，replicaSet应该已经被初始化好了，会显示 `rs0 [direct:primary] test>` 。

  

然后两次 `exit` 退出mongosh和docker container。

  

## 第三步 重新部署mongodb

  

将之前的docker-compose.yml文件中的注释取消。运行：

  

```bash

docker compose down

  

docker compose up -d

```

  

此时mongodb可以读取到用户名、密码和用于replicaSet集群设定的keyfile，应该终于可以正常启动了。外部链接时使用类似如下mongoUri：

  

```url

mongodb://<username>:<password>@hostname:port/?directConnection=true

```

  

# 后记

  

mongodb基本功能我还没有用明白，折腾这个号称更加强大的replication，主要是为了使用其中的

```javascript

import { ChangeStreamEvents } from "mongodb"

```

来监视数据库变化。完全没想到这个部署过程居然如此艰难。不过也算累积了一些经验，那就是：尽量避开高级功能。

  

# 参考资料

  

 - https://www.mongodb.com/compatibility/deploying-a-mongodb-cluster-with-docker

 - https://zgadzaj.com/development/docker/docker-compose/turning-standalone-mongodb-server-into-a-replica-set-with-docker-compose#new-replica-set-configuration

 - https://lizarddapp.medium.com/setup-mongodb-replica-set-with-authentication-using-docker-aac0c5f7583c

 - https://medium.com/workleap/the-only-local-mongodb-replica-set-with-docker-compose-guide-youll-ever-need-2f0b74dd8384