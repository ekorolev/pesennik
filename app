#!/bin/bash
IMAGE_NAME="projects/pesennik"

command="$1"
shift

function parse_build_args {
    case $1 in
        -i|--image-name)
        IMAGE_NAME=$2
        ;;
    esac
}
function parse_create_args {
    case $1 in
        -m|--mongo-link)
            MONGO_LINK=$2
            ;;
        -r|--redis-link)
            REDIS_LINK=$2
            ;;
        -mh|--mongo-host)
            MONGO_HOST=$2
            ;;
        -mp|--mongo-port)
            MONGO_PORT=$2
            ;;
        -rh|--redis-host)
            REDIS_HOST=$2
            ;;
        -rp|--redis-port)
            REDIS_PORT=$2
            ;;
        -n|--name)
            CONTAINER_NAME="--name $2"
            ;;
        -i|--image-name)
            IMAGE_NAME=$2
            ;;
        -p|--port|--expose-port)
            EXPOSE_PORT="-p $2:7991"
            ;;
    esac
}
function parse_start_args {
    echo "$1 $2"
}
function parse_stop_args {
    echo "$1 $2"
}
function parse_restart_args {
    echo "$1 $2"
}

function error_exit {
	echo "$1" 1>&2
	exit $2
}

case $command in
    build)
        while [[ $# -gt 1 ]]
        do
            parse_build_args $1 $2
            shift
            shift
        done
        docker build -t $IMAGE_NAME .
        ;;

    create)
        while [[ $# -gt 1 ]]
        do
            parse_create_args $1 $2
            shift
            shift
        done
        if [[ -z $IMAGE_NAME ]]; then
            error_exit "ERROR: -i option required" 128
        fi
        # mongo container link option
        if [[ -n $MONGO_LINK ]]; then
            if [[ -z $MONGO_HOST ]]; then
                error_exit "ERROR: -mh option required if -m option defined" 128
            fi
            mlink="--link $MONGO_LINK:$MONGO_HOST"
        fi
        # mongo host/port enviromrnts options
        menv=""
        if [[ -n $MONGO_HOST ]]; then
            menv="$menv -e MONGO_HOST=$MONGO_HOST"
        fi
        if [[ -n $MONGO_PORT ]]; then
            menv="$menv -e MONGO_PORT=$MONGO_PORT"
        fi
        # redis container link option
        if [[ -n $REDIS_LINK ]]; then
            if [[ -z $REDIS_HOST ]]; then
                error_exit "ERROR: -mh option required if -m option defined" 128
            fi
            rlink="--link $REDIS_LINK:$REDIS_HOST"
        fi
        # redis host/port enviromrnts options
        renv=""
        if [[ -n $REDIS_HOST ]]; then
            renv="$renv -e REDIS_HOST=$REDIS_HOST"
        fi
        if [[ -n $REDIS_PORT ]]; then
            renv="$renv -e REDIS_PORT=$REDIS_PORT"
        fi
        docker create -t $rlink $mlink $menv $renv $EXPOSE_PORT $CONTAINER_NAME $IMAGE_NAME
        ;;

    start)
        echo 'start'
        ;;
    stop)
        echo 'stop'
        ;;
    restart)
        echo 'restart'
        ;;
esac
