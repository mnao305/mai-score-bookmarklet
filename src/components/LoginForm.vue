<template>
  <div id="loginForm">
    <button @click="twitterLogin">Twitterログイン</button><br />
    <p>※ポップアップがブロックされることがありますが、それを許可してください。</p>
    <label>メールアドレス<br /><input type="text" name="mail" id="mail" v-model="mail"/></label><br />
    <label>パスワード<br /><input type="password" name="passwd" id="passwd" v-model="passwd"/></label><br />
    <button @click="mailLogin">メールログイン</button>
    <p>※舞スコアに登録したメールアドレス・パスワードでログインしてください。</p>
    <p class="errorMessage">{{ errorMessage }}</p>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import auth from '@/plugins/auth'
import { db } from '@/plugins/firestore'

@Component
export default class LoginForm extends Vue {
  errorMessage = ''
  mail = ''
  passwd = ''

  async twitterLogin () {
    try {
      const data = await auth.twitterLogin()
      if (!(data && data.user)) throw new Error()
      const dbData = await db
        .collection('users')
        .doc(data.user.uid)
        .get()
      if (!dbData.exists) {
        // DBにデータがなければ新規ユーザとしエラーを吐く
        this.errorMessage = '先にWebページにて新規登録してください。'
        await auth.logout()
        return
      }

      if (!data.credential) {
        throw new Error()
      }
      const credential = data.credential as firebase.auth.OAuthCredential
      await db
        .collection('users')
        .doc(dbData.id)
        .collection('secure')
        .doc(dbData.id)
        .set(
          {
            accessToken: credential.accessToken,
            secret: credential.secret
          },
          { merge: true }
        )
      this.$emit('loginCheck')
    } catch (error) {
      this.errorMessage = 'ログインに失敗しました。再度お試しください'
    }
  }
  async mailLogin () {
    try {
      await auth.mailLogin(this.mail, this.passwd)
      this.$emit('loginCheck')
    } catch (error) {
      this.errorMessage = 'ログインに失敗しました。入力内容確認の上再度お試しください'
    }
  }
}
</script>

<style lang="scss" scoped>
#loginForm {
  margin: 10px;
  max-width: 500px;
  margin: 30px auto;
  text-align: center;
  * {
    all: initial;
  }
  .errorMessage {
    color: red;
  }
  button,
  input {
    margin-bottom: 10px;
  }
  button {
    -webkit-appearance: button;
    -webkit-writing-mode: horizontal-tb !important;
    text-rendering: auto;
    color: buttontext;
    letter-spacing: normal;
    word-spacing: normal;
    text-transform: none;
    text-indent: 0px;
    text-shadow: none;
    display: inline-block;
    text-align: center;
    align-items: flex-start;
    cursor: default;
    background-color: buttonface;
    box-sizing: border-box;
    margin: 0em;
    font: 400 13.3333px Arial;
    padding: 1px 6px;
    border-width: 2px;
    border-style: outset;
    border-color: buttonface;
    border-image: initial;
  }
  input {
    -webkit-writing-mode: horizontal-tb !important;
    text-rendering: auto;
    color: initial;
    letter-spacing: normal;
    word-spacing: normal;
    text-transform: none;
    text-indent: 0px;
    text-shadow: none;
    display: inline-block;
    text-align: start;
    -webkit-appearance: textfield;
    background-color: white;
    -webkit-rtl-ordering: logical;
    cursor: text;
    margin: 0em;
    font: 400 13.3333px Arial;
    padding: 1px 0px;
    border-width: 2px;
    border-style: inset;
    border-color: initial;
    border-image: initial;
    width: 90%;
  }
  p {
    display: block;
    margin-block-start: 1em;
    margin-block-end: 1em;
    margin-inline-start: 0px;
    margin-inline-end: 0px;
  }
}
</style>
