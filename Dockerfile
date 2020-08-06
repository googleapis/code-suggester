FROM node:12
RUN npm install code-suggester -g
RUN sudo apt install git
ENTRYPOINT ["code-suggester"]
