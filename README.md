Start application in docker containers
------------------
1. Start Mongo and Redis service containers or install services on host machine
2. Build image
    `./app build -i <image name>`
    ex. `./app build -i projects/pesennik`
3. Create application container
    ```
        $ ./app create -m <mongo container> \
                     -mh <mongo host name> \
                     -mp <mongo port> \
                     -r <redis container> \
                     -rh <redis host name> \
                     -rp <redis port> \
                     -p <expose port> \
                     -i <docker image name> \
                     -n <container name
    ```
    ex. `./app create -m mongo-service -mh mongo -mp 27017 -r redis-service -rh redis -rp 6379 -p 8080 -i projects/pesennik -n pesennik`
4. Add app container to systemctl.
    - enable service
    `$ sudo systemctl enable {path to}/pesennik.service`
    - start service
    `$ systemctl start pesennik`
