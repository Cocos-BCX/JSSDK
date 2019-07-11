import { Apis } from 'bcxjs-ws';
import NodesManager from './nodes-manager';
import * as types from '../../mutations';

let nodesManager;
/**
 * Connects to bcxjs-ws with provided callback function
 * United Labs of BCTech.
 */
const connect = async ({statusCallback=null, changeNodeUrl="",store,refresh=false}) => {
  let {ws_node_list,select_ws_node,check_cached_nodes_data}=store.rootGetters["setting/g_settingsAPIs"];

  let url=changeNodeUrl;
  let isTestPing=false;//check if ping tested; 
  if(!nodesManager||refresh){
    nodesManager = new NodesManager({
      nodes:ws_node_list,
      defaultNode:changeNodeUrl
    });
    isTestPing=true;
    await nodesManager.testNodesPings();
  }
  if(url){
    //if connected url is selected address, then get another address
    if(select_ws_node==url) url = nodesManager.getAnotherNodeUrl(url)||url;
  }else{
    //if connected url is null or empty, then connect the fastest one
    nodesManager._selectedNodeUrl="";
    if(!isTestPing) await nodesManager.testNodesPings();
    url = nodesManager.getInitialNodeUrl();
  }

  if(url){
    console.log('Connecting to node : ', url);
    store.commit(types.RPC_STATUS_UPDATE, { status:'connecting',url });
    Apis.instance(url, true,4000,undefined,()=>{statusCallback&&statusCallback('closed');})
    .init_promise.then(() => {
      Apis.setAutoReconnect(false);
      statusCallback&&Apis.setRpcConnectionStatusCallback(statusCallback);
      statusCallback&&statusCallback('realopen',url);
    }).catch(error => {
      statusCallback&&statusCallback('error',url);
    });
  }else{
    statusCallback&&statusCallback('error',url);
  }
};

const testNodesPings=(refresh=false)=>{
  if(!nodesManager){
    return 
  }
  if(refresh){
    return nodesManager.testNodesPings();
  }
  return nodesManager._nodes;
}

const addAPINode=async node=>{
  nodesManager.addAPINode(node);
  if(nodesManager){
    return await nodesManager.testNodesPings()
  }
}

const deleteAPINode=url=>{
  nodesManager.deleteAPINode(url);
}

const setAPINode=nodes=>{
  if(nodesManager)
  return nodesManager.setAPINode(nodes);
}

const disconnect = () => {
  Apis.setRpcConnectionStatusCallback(null);
  return Apis.close();
};


export default {
  connect, disconnect,testNodesPings,addAPINode,deleteAPINode,setAPINode 
};
