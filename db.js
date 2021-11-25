const Sequelize = require('sequelize');
const moment = require('moment');

const {
    RDS_USER,
    RDS_PASSWORD,
    RDS_HOST
} = process.env;

const models = require('./models');

const getRandomWithinRange = (min, max) => {
    min = Math.ceil(min)
    max = Math.floor(max)
    return Math.floor(Math.random() * (max - min + 1)) + min // The maximum is inclusive and the minimum is inclusive
}
  
const maxConnectionAge = moment.duration(10, 'minutes').asSeconds()
  
const pool = {
    handleDisconnects: true,
    min: 1, // Keep one connection open
    max: 10, // Max 10 connections
    idle: 9000, // 9 secondes
    validate: (obj) => {
      // Recycle connexions periodically
      if (!obj.recycleWhen) {
        // Setup expiry on new connexions and return the connexion as valid
        obj.recycleWhen = moment().add(getRandomWithinRange(maxConnectionAge, maxConnectionAge * 2), 'seconds')
        return true
      }
      // Recycle the connexion if it has expired
      return moment().diff(obj.recycleWhen, 'seconds') < 0
    }
}
const master = { rdsClusterWriterEndpoint: RDS_HOST, username: RDS_USER, password: RDS_PASSWORD, port: 3306, database: "hubs-development-db", pool }
const replica = { rdsClusterWriterEndpoint: RDS_HOST, username: RDS_USER, password: RDS_PASSWORD, port: 3306, database: "hubs-development-db", pool }

class DB {
    constructor(path) {
        this.ready = false;
        // this.sequelize = new Sequelize({
        //     dialect: 'sqlite',
        //     storage: path
        // });

        const sequelize = new Sequelize(null, null, null, {
            dialect: 'mysql',
            replication: {
              write: master,
              read: [replica]
            }
        })
          
        // this.sequelize = new Sequelize("hubs-development-db", RDS_USER, RSD_PASSWORD,{
        //     host: RDS_HOST,
        //     logging: console.log,
        //     maxConcurrentQueries: 100,
        //     dialect: 'mysql',
        //     dialectOptions : {
        //         ssl: true
        //     },
        //     pool: { maxConnections: 5, maxIdleTime: 30},
        //     language: 'en'
        // });
        // cannot use async here :( 
        this.sequelize.authenticate().then(() => {
            try {
                this.bootstrap();
            } catch (e) {
                console.log(e);
            } finally {
                this.ready = true;
                console.log('Connection has been established successfully.')
            }

        }).catch(err => console.log(err))
        this.models = {};
    }

    createModel(name, definition) {
        if (Object.keys(this.models).includes(name)) {
            throw new Error(`${name} already exists in models`);
        }
        this.models[name] = this.sequelize.define(name, definition);
        return this.models[name]
    }

    bootstrap() {
        for (let modelName in models) {
            try {
                if (!models[modelName]) {
                    throw Error(`Invalid model ${modelName}`);
                }
                const model = this.createModel(modelName, models[modelName]);
                if (process.env.BOOTSTRAP_DB) {
                    // create in DB
                    model.sync({
                        alter: true
                    });
                }
            } catch (e) {
                console.log(e, {
                    models
                });
            }
        }
    }
    async query(entity, filter) {
        if (!this.ready) {
            throw new Error("Unable to connect to DB");
        }
        if (!Object.keys(this.models).includes(entity)) {
            throw new Error(`${entity} does not exist.}`)
        }
        if (!Object.keys(entity).length) {
            throw new Error("Empty queries not allowed. Use Entity.findAll()}");
        }
        return this.models[entity].findAll({
            where: filter
        });
    }

    async count(entity, filter) {
        if (!this.ready) {
            throw new Error("Unable to connect to DB");
        }
        if (!Object.keys(this.models).includes(entity)) {
            throw new Error(`${entity} does not exist.}`)
        }
        if (!Object.keys(entity).length) {
            throw new Error("Empty queries not allowed. Use Entity.findAll()}");
        }
        return this.models[entity].count({
            where: filter
        });
    }

}

module.exports = new DB(process.env.DB_PATH ? process.env.DB_PATH : "/tmp/sql.db");