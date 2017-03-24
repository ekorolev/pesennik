FROM node:6.10
MAINTAINER Korolev

RUN mkdir /var/webapp

ADD ./package.json /var/webapp/package.json
ADD ./app.js /var/webapp/app.js
ADD ./lib /var/webapp/lib
ADD ./models /var/webapp/models
ADD ./public /var/webapp/public
ADD ./routes /var/webapp/routes
ADD ./scripts /var/webapp/scripts
ADD ./views /var/webapp/views

RUN cd /var/webapp && npm install

CMD node /var/webapp/app.js
