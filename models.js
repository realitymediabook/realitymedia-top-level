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

module.exports = {
    User
};