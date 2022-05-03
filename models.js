const {
    DataTypes
} = require('sequelize');

const User = {
    // Model attributes are defined here
    id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        unique: true,
        primaryKey: true
    },
    userData: {
        type: DataTypes.STRING,
        defaultValue: "{}",
        allowNull: false
    }
}

const Room = {
    roomId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    roomUri: {
        type: DataTypes.STRING,
        allowNull: false
    },
    sceneUri: {
        type: DataTypes.STRING,
        allowNull: false
    },
    ownerId: {
        type: DataTypes.BIGINT,
        references: {
            model: 'Users', // 'Users' refers to table name
            key: 'id', // 'id' refers to column name in User table
        }
    }
}

const Log = {
    timestamp: {
        allowNull: false,
        type: DataTypes.DATE
    },
    userId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
            model: 'Users', // 'Users' refers to table name
            key: 'id', // 'id' refers to column name in User table
        }
    },
    event: {
        type: DataTypes.STRING,
        allowNull: false
    },

    scene: {
        type: DataTypes.INTEGER,
        defaultValue: -1
    },
    wayPoint: {
        type: DataTypes.STRING,
        defaultValue: ""
    },
    param1: {
        type: DataTypes.STRING,
        defaultValue: ""
    },
    param2: {
        type: DataTypes.STRING,
        defaultValue: ""
    }
}

module.exports = {
    User,
    Room
};