const mongoose = require("mongoose");

const schemaStateTreasure = new mongoose.Schema({
  addressUser: {
    type: String,
    require: true,
  },
  flagLocked: {
    type: Boolean,
    require: true,
    default: false,
  },
  flagOpened: {
    type: [
      {
        nameBox: String,
        itemType: String,
        itemName: String,
        flagOpenedBox: Boolean,
        timeOpened: String,
      },
    ],
    require: true,
  },
});

const schemaDataTreasure = new mongoose.Schema({
  name: {
    type: String,
    require: true,
  },
  passcode: {
    type: String,
    require: true,
  },
});

const stateTreasure = mongoose.model("state_treasures", schemaStateTreasure);
const dataTreasure = mongoose.model("data_treasures", schemaDataTreasure);

module.exports = {
  modalDataTreasure: dataTreasure,
  modalStateTreasure: stateTreasure,
};
