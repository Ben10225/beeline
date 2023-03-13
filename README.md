<a align="center" href="https://beelinetw.com/">
  <p align="center">
    <img width="300" src="https://github.com/Ben10225/beeline/blob/main/public/images/logo-01.jpg" style="width: 150px" />
  </p>
</a>

# [beeline](https://beelinetw.com/)

Beeline is an innovative solution of online meeting, you can meet each other without physical contact, and share all kinds of things in your life.

<br/>

🔗 Website URL: https://beelinetw.com/

📃 API Doc: https://app.swaggerhub.com/apis-docs/Ben10225/beeline/1.0.11#/

🏷 Test account and password

|Account|Password|
|---|---|
|tester@gmail.com|test1234|

<br/>

- [Main Features](#main-features)
  - [Host system](#host-system)
  - [Real-time services](#real-time-services)
  - [Screen sharing](#screen-sharing)
- [Architecture](#architecture)
- [Backend Technique](#backend-technique)
- [Frontend Technique](#frontend-technique)
- [Contact](#contact)

## Main Features

### Host system

+ The user who enters room the first is the room host.
+ Room members should send a request for entering the room .
+ The host can assign the other member to be the host.
+ If the host leaves the room without assigning a new host, server will randomly assign one of the left members to be the host.

<img src="https://github.com/Ben10225/beeline/blob/main/public/images/host-demo.gif" width=600 />

### Real-time services

+ Chat, Emoji, Game and Whiteboard.

<img src="https://github.com/Ben10225/beeline/blob/main/public/images/real-time-demo.gif" width=600 />

### Screen sharing

<img src="https://github.com/Ben10225/beeline/blob/main/public/images/screen-share-demo.gif" width=600 />

## Architecture

<img src="https://github.com/Ben10225/beeline/blob/main/public/images/web-structure.jpg" width=600 />

## Backend Technique

### Framework

- Gin (Go) for backend server

### Infrastructure

- Docker
- DNS
- Nginx
- SSL (Zero SSL)

### Database

- MongoDB Altlas

### Cloud Services

- AWS EC2
- AWS S3
- AWS CloudFront

### Sequence Diagram

<img src="https://github.com/Ben10225/beeline/blob/main/public/images/sequence-diagram.jpg" width=600 />

## Frontend Technique

+ HTML / CSS (SCSS) / JavaScript
+ AJAX
+ PeerJS

### WebRTC

<img src="https://github.com/Ben10225/beeline/blob/main/public/images/ice.jpg" width=600 />

## Contact
🧑🏻‍💻 Hung-Lun, Peng

✉️ Email: bbnn669999@gmail.com
