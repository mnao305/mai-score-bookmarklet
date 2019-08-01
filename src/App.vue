<template>
  <div id="mai-score-bookmarklet">
    <div class="mai-score-bookmarklet-window">
      <button id="closeBtn" @click="closeBookmarkletWindow">[×]閉じる</button>
      <AddScoreData :uid="uid" @loginCheck="loginCheck" v-if="uid" />
      <LoginForm @loginCheck="loginCheck" v-else />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import LoginForm from './components/LoginForm.vue'
import AddScoreData from './components/AddScoreData.vue'
import auth from '@/plugins/auth'

@Component({
  components: {
    LoginForm,
    AddScoreData
  }
})
export default class App extends Vue {
  uid: any = null

  async created () {
    this.loginCheck()
  }

  async loginCheck () {
    const data = await auth.auth()
    if (data) {
      this.uid = data.uid
    } else {
      this.uid = null
    }
  }
  closeBookmarkletWindow () {
    const dom = document.getElementById('mai-score-bookmarklet') as HTMLElement
    const parent = dom.parentNode as Node & ParentNode
    parent.removeChild(dom)
  }
}
</script>

<style lang="scss">
#mai-score-bookmarklet {
  position: fixed;
  top: 0;
  left: 0;
  background-color: rgba(0, 0, 0, 0.7);
  width: 100%;
  height: 100%;
  #closeBtn {
    display: block;
    margin: 0 0 0 auto;
  }
}
.mai-score-bookmarklet-window {
  background-color: white;
  border: 1px solid black;
  width: 80%;
  height: 400px;
  position: fixed;
  top: 10%;
  left: 10%;
}
</style>
