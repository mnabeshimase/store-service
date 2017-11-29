# RecommendationNation

RecommendationNation is a recommender system for online store services. This repository contains datastore service.

# Table of Contents

1. [Usage](#Usage)
1. [Requirements](#requirements)
1. [Development](#development)
    1. [Installing Dependencies](#installing-dependencies)
    1. [Tasks](#tasks)
1. [Other Information](oOther Information)

## Usage
Docker images for the web server and MySQL server can be built from Dockerfile and Dockerfile-mysql respectively. MySQL server requires store-service-mysql-root.txt file to store the password; this file is added to docker secret. To run the service on production environment, run `docker stack deploy -c docker-compose.yml store-service`. To perform tests using Mocha, run  `npm test`.

## Requirements
- Docker 17.09.0-ce
- Elasticsearch 5.6.3
- Kibana 5.6.3
- MongoDB 3.4.9
- MySQL 5.7.19
- Node 8.6.0
- npm 5.1.1

## Development
### Installing-dependencies
To install dependencies for the node server, run `npm install`.
### Tasks
- Receive tracking data from mobile devices
- Store each user's short-term sessions and long-term login/logout history
- Store geographical data for each http request
- Migrate to Amazon RDS

## Other Information
The store service archives various user events from purchases to mouse tracking data. It is designed to be highly available and scalable in order to accommodate fluctuation of user traffic while efficiently utilizing resources. The collected data is then sent to two recommendation-algorithm services and an analytics service via SQS message buses before optimized recommendation lists are generated for each user. The following image is a diagram of the overall system with 4 components.<BR>
<img alt="system design diagram" src="https://www.lucidchart.com/publicSegments/view/7543e303-807e-468d-beb7-5cc192af5f09/image.png" height="320">
