import NodesManager from './nodes-manager';

onmessage = function(event) { try {
    console.log("pingWorker start");
    var _event_data= event.data
    var {nodes} = event.data;
    nodes=JSON.parse(JSON.stringify(nodes));

    let ws_node_list={};
    nodes.forEach(node=>{
      ws_node_list[node.url]={location:node.name};
    })

    console.info("nodes",nodes,"forEach" in nodes,ws_node_list);

    // let testNodes =await (new NodesManager({
    //     nodes:ws_node_list,
    //     defaultNode:""
    //  }).testNodesPings());

     (new NodesManager({
        nodes:ws_node_list,
        defaultNode:""
     }).testNodesPings()).then(testNodes=>{
        testNodes=Object.keys(testNodes).map(key=>{
            let {location,ping}=testNodes[key];
            return {
                url:key,
                name:location,
                ping
            }
          });
          postMessage(testNodes);
     });


 
} catch( e ) { console.error("pingWorker", e) } }