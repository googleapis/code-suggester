FROM node:12
RUN npm install code-suggester -g
RUN apt-get -y install git
COPY entrypoint.sh /entrypoint.sh
RUN chmod u+x /entrypoint.sh
ENTRYPOINT  ["/entrypoint.sh"]