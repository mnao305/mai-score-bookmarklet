<template>
  <a href="" @click.prevent="updateScoreTweet">画像付きスコア更新ツイート</a>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import axios from 'axios'
import firebase from '@/plugins/firebase'

@Component
export default class addScoreData extends Vue {
  async updateScoreTweet () {
    this.$emit('tweetStatusUpdate', 'ツイート中です...')
    try {
      const token = await firebase.auth().currentUser!.getIdToken()
      await axios.get('https://us-central1-mai-score.cloudfunctions.net/tweet', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      this.$emit('tweetStatusUpdate', 'ツイート成功しました！')
    } catch (error) {
      console.error(error)
      this.$emit('tweetStatusUpdate', 'ツイート失敗しました...')
    }
  }
}
</script>
