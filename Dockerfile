FROM node:12
RUN npm install code-suggester -g
RUN apt-get -y install git
ENTRYPOINT code-suggester $INPUT_COMMAND --$