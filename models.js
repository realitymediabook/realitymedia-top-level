const {
    DataTypes
} = require('sequelize');

const User = {
    // Model attributes are defined here
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        primaryKey: true
    },
    userData: {
        type: DataTypes.JSON,
        defaultValue: "{}",
        allowNull: false
    }
}

const Room = {
    roomId: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true
    },
    ownerId: {
        type: DataTypes.INTEGER,
        references: {
            model: 'Users', // 'Users' refers to table name
            key: 'id', // 'id' refers to column name in User table
        }
    }
}

module.exports = {
    User,
    Room
};