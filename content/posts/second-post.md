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

      - 37017:27017

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


...

  

# 参考资料

  test

 - https://www.mongodb.com/compatibility/deploying-a-mongodb-cluster-with-docker

 - https://zgadzaj.com/development/docker/docker-compose/turning-standalone-mongodb-server-into-a-replica-set-with-docker-compose#new-replica-set-configuration

 - https://lizarddapp.medium.com/setup-mongodb-replica-set-with-authentication-using-docker-aac0c5f7583c

 - https://medium.com/workleap/the-only-local-mongodb-replica-set-with-docker-compose-guide-youll-ever-need-2f0b74dd8384