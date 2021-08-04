const {
    DataTypes
} = require('sequelize');

const User = {
    // Model attributes are defined here
    email: {
        type: DataTypes.STRING,
        allowNull: false
    },
    token: {
        type: DataTypes.STRING,
        allowNull: false

    },
    name: {
        type: DataTypes.STRING,
        allowNull: true
    },
    userData: {
        type: DataTypes.JSON,
        allowNull: true
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
        type: Sequelize.INTEGER,
        references: {
            model: 'User', // 'User' refers to table name
            key: 'id', // 'id' refers to column name in User table
        }
    }
}

module.exports = {
    User,
    Room
};