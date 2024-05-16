const express = require("express");
const router = express.Router();
const { modalStateTreasure } = require("../schema/treasure");
const modalTime = require("../schema/time");
const {
  phantasmaJS,
  PhantasmaTS,
  ScriptBuilder,
  Decoder,
  PhantasmaAPI,
  Transaction,
  Base16,
  encodeBase16,
  PhantasmaKeys,
  Address,
} = require("phantasma-ts");

router.post("/get_state_treasure", async (req, res) => {
  const dataTreasure = req.body.dataTreasure;
  let tempTreasure = await modalStateTreasure.find({
    addressUser: req.body.addressWallet,
  });

  // // set local time to EST date without time. e.g: 07/12/2023
  // const now = new Date();
  // const options = { timeZone: "America/New_York", timeZoneName: "short" };
  // const estDateTime = now.toLocaleString("en-US", options);
  // const estDate = estDateTime.split(",");

  // console.log(estDate[0]);
  // const newTime = new modalTime({
  //   timeLockTreasure: estDate[0],
  //   timeLockMintOutfit: estDate[0],
  // });
  // try {
  //   await newTime.save();
  // } catch (error) {
  //   console.log("errorTime:", error);
  // }

  let timeLockTreasure = await modalTime.find();
  const dateNow = new Date().toLocaleDateString("en-US", {
    timeZone: "America/New_York",
    timeZoneName: "short",
  });
  const miliSecondsNow = new Date(dateNow).getTime();
  const miliSecondsLock = new Date(
    timeLockTreasure[0].timeLockTreasure
  ).getTime();

  if (tempTreasure.length === 0) {
    let arrayFlagOpened = [];
    for (let i = 0; i < dataTreasure.length; i++) {
      let tempFlagOpened = {
        nameBox: dataTreasure[i].name,
        itemType: "",
        itemName: "",
        flagOpenedBox: false,
        timeOpened: "",
      };
      arrayFlagOpened.push(tempFlagOpened);
    }
    console.log(arrayFlagOpened);
    const newTreasure = new modalStateTreasure({
      addressUser: req.body.addressWallet,
      flagLocked: miliSecondsLock > miliSecondsNow ? true : false,
      flagOpened: arrayFlagOpened,
    });
    try {
      newTreasure.save();
    } catch (error) {
      console.log("save treasure:", error);
    }
  } else {
    return res.send({
      stateTreasure: tempTreasure,
    });
  }
});

router.post("/update_state_treasure", async (req, res) => {
  try {
    let tempState = await modalStateTreasure.find({
      addressUser: req.body.addressWallet,
    });

    let tempArrayState = [];
    for (let i = 0; i < tempState[0].flagOpened.length; i++) {
      if (tempState[0].flagOpened[i]?.nameBox === req.body.nameBox) {
        let tempOpened = {
          nameBox: req.body.nameBox,
          itemType: req.body.itemType,
          itemName: req.body.itemName,
          flagOpenedBox: true,
          timeOpened: req.body.timeOpened,
        };
        tempArrayState.push(tempOpened);
        // modalStateTreasure.findOneAndUpdate({addressUser: req.body.addressWallet},
        //     {$set: {flagOpened:}})
      } else {
        tempArrayState.push(tempState[0].flagOpened[i]);
      }
    }
    // console.log(tempArrayState)
    await modalStateTreasure.updateOne(
      { addressUser: req.body.addressWallet },
      { $set: { flagLocked: true, flagOpened: tempArrayState } }
    );
    return res.json({ success: true });
  } catch (error) {
    console.log(error);
    return res.json({ success: false, error: error });
  }
});

router.post("/mint_treasure", async (req, res) => {
  console.log(req.body);

  // let targetNet = 'main';
  // let RPC = new PhantasmaTS.PhantasmaAPI(
  //   "http://localhost:7077/rpc",
  //   null,
  //   "simnet"
  // );

  // const sb = new ScriptBuilder();
  // const myScript = sb.BeginScript().CallContract("AAAB", "hasSandyBody", ["P2K9zmyFDNGN6n6hHiTUAz6jqn29s5G1SWLiXwCVQcpHcQb"]).EndScript();

  // RPC.invokeRawScript(targetNet, myScript).then((response) => {
  //   const decoder = new Decoder(response.result);
  //   const value = decoder.readVmObject();

  // 	res.status(200).json({
  //     value
  //   })
  // });

  let tempHash = await mintTreasure(
    req.body.address,
    req.body.type,
    req.body.name
  );
  console.log(tempHash);
  if (tempHash !== null || tempHash !== undefined) {
    return res.json({
      flagSuccess: true,
    });
  } else {
    return res.json({
      flagSuccess: false,
    });
  }
});

async function mintTreasure(toAddress, genre, treasureType) {
  let Keys = PhantasmaKeys.fromWIF(
    "KxMn2TgXukYaNXx7tEdjh7qB2YaMgeuKy47j4rvKigHhBuZWeP3r"
  );

  let expiration = new Date(Date.now() + 60 * 60 * 10 * 1000);
  console.info("Expiration:", expiration);
  let script;

  let sb = new ScriptBuilder();
  let myScript = sb.AllowGas(Keys.Address, Address.Null, 100000, 210000);

  // myScript = sb.CallInterop("Runtime.TransferTokens", [Keys.Address.Text, "P2K65RZhfxZhQcXKGgSPZL6c6hkygXipNxdeuW5FU531Bqc", "SOUL", 1000000000]);

  myScript = sb.CallContract("AAAB", "mintTreasure", [
    toAddress,
    genre,
    treasureType,
  ]);

  myScript = sb.SpendGas(Keys.Address);
  script = myScript.EndScript();

  const Payload = Base16.encode("Airdrop - Deposit");

  const tx = new Transaction("simnet", "main", script, expiration, Payload);

  tx.signWithKeys(Keys);

  const rawTx = Base16.encodeUint8Array(tx.ToByteAray(true));

  let RPC = new PhantasmaTS.PhantasmaAPI(
    "http://localhost:7077/rpc",
    null,
    "simnet"
  );

  const hash = await RPC.sendRawTransaction(rawTx);
  return hash;
  // console.info(rawTx);
}

module.exports = router;
