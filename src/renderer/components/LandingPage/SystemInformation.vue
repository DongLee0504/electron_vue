<template>
  <div>
    <div class="title">Information</div>
    <div class="items">
      <div class="item">
        <div class="name">Path:</div>
        <div class="value">{{ path }}</div>
      </div>
      <div class="item">
        <div class="name">Route Name:</div>
        <div class="value">{{ name }}</div>
      </div>
      <div class="item">
        <div class="name">Vue.js:</div>
        <div class="value">{{ vue }}</div>
      </div>
      <div class="item">
        <div class="name">Electron:</div>
        <div class="value">{{ electron }}</div>
      </div>
      <div class="item">
        <div class="name">Node:</div>
        <div class="value">{{ node }}</div>
      </div>
      <div class="item">
        <div class="name">Platform:</div>
        <div class="value">{{ platform }}</div>
      </div>
    </div>
    <button @click="update">点击更新</button>
    <button @click="openView">打开网页</button>
    <button @click="pushNotify">推送消息</button>
    <button @click="sendNotify">渲染进程消息</button>
    <button @click="displayBalloon">显示气泡</button>
  </div>
</template>

<script>
const { ipcRenderer } = require("electron");
export default {
  data() {
    return {
      electron: process.versions.electron,
      name: this.$route.name,
      node: process.versions.node,
      path: this.$route.path,
      platform: require("os").platform(),
      vue: require("vue/package.json").version
    };
  },
  mounted() {
    ipcRenderer.on("message", (e, data) => {
      console.log(data);
    });
    ipcRenderer.on("downloadProgress", (e, data) => {
      console.log("1.0.6");
      console.log(data);
    });
  },
  methods: {
    update() {
      ipcRenderer.send("checkUpdate", 123);
    },
    openView() {
      ipcRenderer.send("openVier", { url: "http://www.baidu.com" });
    },
    pushNotify() {
      ipcRenderer.send("pushNotify", {
        title: "我来啦",
        option: { body: "约饭啊" }
      });
    },
    // TODO: 渲染进程显示通知
    sendNotify() {
      let myNotification = new Notification("标题", {
        body: "通知正文内容"
      });
      myNotification.onclick = () => {
        console.log("通知被点击");
      };
    },
    displayBalloon() {
      ipcRenderer.send("displayBalloon", {
        title: "我是气泡",
        iconType: "custom",
        content: "你有一条新消息"
      });
    }
  }
};
</script>

<style scoped>
.title {
  color: #888;
  font-size: 18px;
  font-weight: initial;
  letter-spacing: 0.25px;
  margin-top: 10px;
}

.items {
  margin-top: 8px;
}

.item {
  display: flex;
  margin-bottom: 6px;
}

.item .name {
  color: #6a6a6a;
  margin-right: 6px;
}

.item .value {
  color: #35495e;
  font-weight: bold;
}
</style>
