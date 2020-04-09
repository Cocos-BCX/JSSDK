// import bcxapi from "./bcx.api"
// var bcxapi = require("./bcx.api")

// require('./bcx.node.js')
let _bcx=require('./bcx.node.js');
// console.log(bcxapi)
// bcxapi.initBcx().then( res => {
//     return new Promise(function (resolve) {
//         console.log(".........initBcx: ", res)
//         resolve(res)
//     })
// }).then(initres => {
//     console.log('initres: ',initres)
// })
let bcx=_bcx.createBCX({
    default_ws_node:"ws://test.cocosbcx.net",
    ws_node_list:[	
         {url:"ws://test.cocosbcx.net",name:"Cocos - China - Beijing"}   	
    ],
    networks:[
        {
            core_asset:"COCOS",
            chain_id:"c1ac4bb7bd7d94874a1cb98b39a8a582421d03d022dfa4be8c70567076e03ad0" 
        }
    ], 
    faucet_url:"",
    auto_reconnect:true,
    real_sub:true,
    check_cached_nodes_data:false                 
});
  bcx.passwordLogin({
    account: "xulin-test",
    password: "xulin123"
  }).then((res) => {
      
    return new Promise(function (resolve, reject) {
        console.log("passwordLogin", res)
        resolve(res)
    })
  }).then(passwordLoginres => {

    return new Promise(function (resolve, reject) {
        console.log("passwordLoginres: ", passwordLoginres)

        bcx.signString({
            signContent: "bD48xrDrZDwe23tKsA2sD3zmJaC2ftBH"
        }).then(res=>{
            console.log("========")
            console.log(res)
            resolve(res)
        });
    })
    
  }).then( signStringres => {

    return new Promise(function (resolve, reject) {
        bcx.checkingSignString({
            checkingSignContent: signStringres.data,
            signContent: "bD48xrDrZDwe23tKsA2sD3zmJaC2ftBH"
        }).then(res=>{
            resolve(res)
        });
    })
  }).then( checkingSignString => {


    console.log("checkingSignString: ", checkingSignString)
    // let trxData={
    //     fromAccount:gel(".div_transferAsset .from_account").value,
    //     toAccount:gel(".div_transferAsset .to_account").value,
    //     amount:amount,
    //     assetId:gel(".div_transferAsset .asset_id").value,
    //     memo:gel(".div_transferAsset .transfer_memo").value,
    //     isPropose:gel(".div_transferAsset .isPropose").checked,
    //     isEncryption:gel(".div_transferAsset .isEncryption").checked
    // };

    let params = {
        fromAccount: "test1",
        toAccount: "xulin-test1",
        amount: 1,
        assetId: "COCOS",
        memo: "I am mechanic",
        isPropose: false,
        isEncryption: true
    }
    bcx.transferAsset(params).then(res=>{
        console.info('transferAsset res',res);
    })
  })