class NodesManager {
  constructor({ nodes, defaultNode }) {
    this._nodes = nodes;
    this._selectedNodeUrl = defaultNode;
    this.firstTestPing=true
  }
  addAPINode(node){
    this._nodes[node.url]={location:node.name};
  }
  deleteAPINode(url){
    delete this._nodes[url];
    // PersistentStorage.saveNodesData({ data: this._nodes });
  }
  setAPINode(nodes){
    this._nodes=nodes;
    return this.testNodesPings();
  }

  _retrieveCachedNodesData() {
    const cachedData = {};//PersistentStorage.getSavedNodesData();
    if(!this._nodes) return;

    Object.keys(this._nodes).forEach(url => {
      const cachedNode = cachedData[url];
      if (cachedNode && cachedNode.ping && typeof (cachedNode.ping) === 'number') {
        this._nodes[url].ping = cachedNode.ping;
      }
    });
  }

  _selectFastestNode() {
    if(!this._nodes) return;
    Object.keys(this._nodes).forEach((url) => {
      const node = this._nodes[url];
      const selectedNode = this._nodes[this._selectedNodeUrl];
      if (node.ping &&node.ping <= (selectedNode?selectedNode.ping:100000)) {
        this._selectedNodeUrl = url;
      }
    });
    return this._selectedNodeUrl;
  }

  static _pingNode(url) {
    return new Promise((resolve) => {
      const date = new Date();
      try{
        let ping_timer=setTimeout(() => {
           resolve(0);
        }, 2000);

        let socket = new WebSocket(url);
        socket.onopen = () => {
          clearTimeout(ping_timer);
          socket.close();
          socket = null;
          resolve(new Date() - date);
        };
        socket.onerror = () => {
          clearTimeout(ping_timer);
          resolve(0);
        };
      }catch(e){
        resolve(e.message);
      }
      
    });
  }

  testNodesPings() {    
    if(!this._nodes) return;
    return new Promise((resolve) => {
      Promise.all(Object.keys(this._nodes).map(async (url) => {
        if (url !== this._selectedNodeUrl||this.firstTestPing||!this._nodes[url].ping) {
          this._nodes[url].ping = await NodesManager._pingNode(url);
        }
      })).then(() => {
        // PersistentStorage.saveNodesData({ data: this._nodes });
        this.firstTestPing=false;
        resolve(this._nodes);
      });
    });
  }

  getInitialNodeUrl() {
    this._retrieveCachedNodesData();
    return this._selectFastestNode();
  }

  getAnotherNodeUrl(url) {
    const urls = Object.keys(this._nodes);
    if(url){
      const index = urls.indexOf(url);
      urls.splice(index, 1);
    }
    
    return urls[Math.floor(Math.random() * urls.length)];
  }
}

export default NodesManager;
