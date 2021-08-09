const {
    DataTypes
} = require('sequelize');

const User = {
    // Model attributes are defined here
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true
        
    },
    userData: {
        type: DataTypes.JSON,
        defaultValue: "{}",
        allowNull: false
    }
}

const Room = {
    id: {
        type: DataTypes.STRING,
        allowNull: false
    },
    owner: {
        type: DataTypes.INTEGER,
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