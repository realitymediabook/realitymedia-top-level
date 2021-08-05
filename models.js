const {
    DataTypes
} = require('sequelize');

const User = {
    // Model attributes are defined here
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    token: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: ""
    },
    userData: {
        type: DataTypes.JSON,
        defaultValue: "{}",
        allowNull: false
    }
}

const Room = {
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    url: {
        type: DataTypes.STRING,
        allowNull: false
    },
    ownerId: {
        type: DataTypes.INTEGER,
        references: {
            model: 'User', // 'User' refers to table name
            key: 'token', // 'id' refers to column name in User table
        }
    }
}

module.exports = {
    User,
    Room
};