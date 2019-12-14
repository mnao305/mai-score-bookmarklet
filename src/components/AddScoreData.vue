<template>
  <div id="addScoreData">
    <button id="logout" @click="logout">ログアウト</button>
    <div class="addScoreDataMain">
      <p>舞スコア データ取得ツール</p>
      <button :disabled="isDisable" :class="{ disableBtn: isDisable }" class="addDataBtn" @click="getData">舞スコアへデータ登録</button>
      <p v-if="message" :class="{ error: error }">{{ message }}</p>
      <div v-if="message === 'データ保存完了！'" class="tweetLink">
        <p v-if="publicData"><a :href="tweetURL" target="_blank">スコア更新ツイート</a></p>
        <p v-if="publicData && twitterLogin"><TweetsWithImages @tweetStatusUpdate="tweetStatusUpdate" /></p>
      </div>
      <p v-if="tweetStatus">{{ tweetStatus }}</p>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import auth from '@/plugins/auth'
import { db } from '@/plugins/firestore'
import Axios from 'axios'
import firebase from '@/plugins/firebase'
import TweetsWithImages from './TweetsWithImages.vue'
import JsSHA from 'jssha'

@Component({
  components: {
    TweetsWithImages
  }
})
export default class addScoreData extends Vue {
  message = ''
  error = false
  @Prop({ default: '' })
  uid?: string;

  publicData = false
  tweetURL = ''
  isDisable = false

  twitterLogin = false
  tweetStatus = ''

  versionMusicList: any = {}

  async created () {
    const docs = await db
      .collection('users')
      .doc(this.uid)
      .collection('secure')
      .doc(this.uid)
      .get()
    let data
    if (docs && docs.exists) {
      data = docs.data()
    }
    if (!data) {
      this.twitterLogin = false
      return
    }
    this.twitterLogin = data.providerData.some((v:any) => {
      return v.providerId === 'twitter.com'
    })
  }

  async getData () {
    this.error = false
    this.isDisable = true
    this.message = 'データ取得準備中...'
    try {
      const { data } = await Axios.get('https://maimaidx.jp/maimai-mobile/home/')
      if (data.match(/ログインしてください/)) {
        this.message = 'maimaiでらっくすNETにログインしていません。ログインしてから再度お試しください。'
        this.error = true
        this.isDisable = false
        return
      }
    } catch (error) {
      console.error(error)
      this.message = '不明なエラーです。再度お試しください。'
      this.error = true
      this.isDisable = false
      return
    }
    await this.getFirstVersion()
    const date = Date.now()
    const difficultyLevel = ['Basic', 'Advanced', 'Expert', 'Master', 'ReMaster']
    let scoreData: any = []
    let updateScoreData = []
    for (let i = 0; i < difficultyLevel.length; i++) {
      const docs = await db
        .collection('users')
        .doc(this.uid)
        .collection('scores')
        .doc(difficultyLevel[i])
        .get()
      let gotOldScore
      if (docs && docs.exists) {
        gotOldScore = docs.data()
      }
      scoreData[difficultyLevel[i]] = {}
      this.message = `${difficultyLevel[i]}データを読み込み中...`
      try {
        const { data } = await Axios.get(`https://maimaidx.jp/maimai-mobile/record/musicGenre/search/?genre=99&diff=${i}`)
        const domparser = new DOMParser()
        const tmpEl = domparser.parseFromString(data, 'text/html')
        const classList = tmpEl.getElementsByClassName('main_wrapper')[0].children as any
        let genre = ''
        for (let j = 0; j < classList.length; j++) {
          if (classList[j].className.indexOf('screw_block') >= 0) {
            genre = classList[j].innerText
            continue
          } else if (classList[j].className.indexOf('w_450') === -1) {
            continue
          }
          const tmp = classList[j].innerText
            .trim()
            .split('\n')
            .map((v:any) => v.trim())

          const type = classList[j].lastElementChild.src.indexOf('standard.png') >= 0 ? 'standard' : 'deluxe'

          // 曲名などからハッシュ値を取って、DBの保存時に使う。
          const shaObj = new JsSHA('SHA-1', 'TEXT')
          shaObj.update(`${tmp[1]}_${difficultyLevel[i]}_${type}_${genre}`)
          const musicHash = shaObj.getHash('HEX')

          const imgList = classList[j].getElementsByClassName('h_30 f_r') as HTMLCollectionOf<HTMLImageElement>
          let rank = null
          let comboRank = null
          let sync = null
          for (let k = 0; k < imgList.length; k++) {
            if (imgList[k].src.indexOf('_fc.png') >= 0) {
              comboRank = 'FC'
            } else if (imgList[k].src.indexOf('_fcp.png') >= 0) {
              comboRank = 'FC+'
            } else if (imgList[k].src.indexOf('_ap.png') >= 0) {
              comboRank = 'AP'
            } else if (imgList[k].src.indexOf('_app.png') >= 0) {
              comboRank = 'AP+'
            } else if (imgList[k].src.indexOf('_d.png') >= 0) {
              rank = 'D'
            } else if (imgList[k].src.indexOf('_c.png') >= 0) {
              rank = 'C'
            } else if (imgList[k].src.indexOf('_b.png') >= 0) {
              rank = 'B'
            } else if (imgList[k].src.indexOf('_bb.png') >= 0) {
              rank = 'BB'
            } else if (imgList[k].src.indexOf('_bbb.png') >= 0) {
              rank = 'BBB'
            } else if (imgList[k].src.indexOf('_a.png') >= 0) {
              rank = 'A'
            } else if (imgList[k].src.indexOf('_aa.png') >= 0) {
              rank = 'AA'
            } else if (imgList[k].src.indexOf('_aaa.png') >= 0) {
              rank = 'AAA'
            } else if (imgList[k].src.indexOf('_s.png') >= 0) {
              rank = 'S'
            } else if (imgList[k].src.indexOf('_ss.png') >= 0) {
              rank = 'SS'
            } else if (imgList[k].src.indexOf('_sss.png') >= 0) {
              rank = 'SSS'
            } else if (imgList[k].src.indexOf('_sp.png') >= 0) {
              rank = 'S+'
            } else if (imgList[k].src.indexOf('_ssp.png') >= 0) {
              rank = 'SS+'
            } else if (imgList[k].src.indexOf('_sssp.png') >= 0) {
              rank = 'SSS+'
            } else if (imgList[k].src.indexOf('_fs.png') >= 0) {
              sync = 'FS'
            } else if (imgList[k].src.indexOf('_fsd.png') >= 0) {
              sync = 'FDX'
            } else if (imgList[k].src.indexOf('_fsp.png') >= 0) {
              sync = 'FS+'
            } else if (imgList[k].src.indexOf('_fsdp.png') >= 0) {
              sync = 'FDX+'
            }
          }
          let musicUpdateDate
          let oldAchievement = []
          let oldDxScore = []
          if (gotOldScore && gotOldScore[musicHash]) {
            oldAchievement = gotOldScore[musicHash].achievements || []
            oldDxScore = gotOldScore[musicHash].dxScores || []
            musicUpdateDate = gotOldScore[musicHash].date || date
          } else {
            musicUpdateDate = date
          }
          // 互換性保持のためしばらくおいておく。しばらくしたら削除する↓
          if (gotOldScore && gotOldScore[`${tmp[1]}_${difficultyLevel[i]}_${type}`]) {
            oldAchievement = gotOldScore[`${tmp[1]}_${difficultyLevel[i]}_${type}`].achievements || []
            oldDxScore = gotOldScore[`${tmp[1]}_${difficultyLevel[i]}_${type}`].dxScores || []
            musicUpdateDate = gotOldScore[`${tmp[1]}_${difficultyLevel[i]}_${type}`].date || date
          }

          let updateFlg = false
          if (
            (oldAchievement.length >= 1 && oldAchievement[oldAchievement.length - 1].achievement !== Number(tmp[2].replace('%', ''))) ||
              (oldAchievement.length === 0 && tmp[2]) ||
              ((oldDxScore.length >= 1 && oldDxScore[oldDxScore.length - 1].dxScore !== Number(tmp[3].replace(',', ''))) || (oldDxScore.length === 0 && tmp[3]))
          ) {
            oldAchievement.push({ achievement: Number(tmp[2].replace('%', '')), date: date })
            oldDxScore.push({ dxScore: Number(tmp[3].replace(',', '')), date: date })
            musicUpdateDate = date
            updateFlg = true
          }

          const tmpList = this.versionMusicList.filter((v:any) => v.title === tmp[1] && v.type === type && v.genre === genre)
          const version = tmpList[0].version

          const achievements = tmp[2] ? oldAchievement : null
          const dxScores = tmp[3] ? oldDxScore : null
          scoreData[difficultyLevel[i]][musicHash] = {
            title: tmp[1],
            achievements: achievements,
            dxScores: dxScores,
            type: type,
            genre: genre,
            difficultyLevel: difficultyLevel[i],
            level: tmp[0].indexOf('+') >= 0 ? Number(tmp[0].replace('+', '')) + 0.5 : Number(tmp[0].replace('+', '')),
            rank: rank,
            comboRank: comboRank,
            sync: sync,
            date: musicUpdateDate,
            musicID: classList[j].getElementsByTagName('input')[0].value,
            version: version
          }
          if (updateFlg) {
            updateScoreData.push(scoreData[difficultyLevel[i]][musicHash])
          }
        }
      } catch (error) {
        console.error(error.data)
        if (error.response && error.response.data && error.response.data.match(/メンテナンス中/)) {
          this.message = 'maimaiでらっくすNETはメンテナンス中です。メンテナンス終了後に再度お試しください。'
          this.error = true
          this.isDisable = false
          return
        }
        continue
      }
    }
    console.log(scoreData)
    await this.getFetchUserData(date)
    this.message = 'プレイ履歴取得中...'
    await this.getRecordData()
    if (updateScoreData.length <= 0) {
      this.message = '更新データはありませんでした'
      return
    }
    this.message = 'データ保存中...'
    for (let i = 0; i < difficultyLevel.length; i++) {
      db.collection('users')
        .doc(this.uid)
        .collection('scores')
        .doc(difficultyLevel[i])
        .set(scoreData[difficultyLevel[i]])
        .catch(e => {
          console.error(e)
        })
    }
    await db.collection('users')
      .doc(this.uid)
      .collection('secure')
      .doc(this.uid)
      .update({
        _updateAt: date
      })
    await this.getTweetURL()
    await this.createScoreImg(updateScoreData)
    this.message = 'データ保存完了！'
  }

  async getFetchUserData (date: number) {
    this.message = 'ユーザデータを読み込み中...'
    try {
      const { data } = await Axios.get('https://maimaidx.jp/maimai-mobile/playerData/')
      const domparser = new DOMParser()
      const element = domparser.parseFromString(data, 'text/html')
      if (data.match(/ログインしてください/)) {
        this.message = 'maimaiでらっくすNETにログインしていません。ログインしてから再度お試しください。'
        this.error = true
        this.isDisable = false
      }
      const gotRating = (element.getElementsByClassName('rating_block f_11')[0] as HTMLElement).innerText
      const gotMaxRating = Number((element.getElementsByClassName('p_r_5 f_11')[0] as HTMLElement).innerText.split('：')[1])
      const gotPlayCount = Number(
        (element
          .getElementsByClassName('m_5 m_t_10 t_r f_12')[0] as HTMLElement)
          .innerText.split('：')[1]
          .split('回')[0]
      )
      const gotUserName = (element.getElementsByClassName('name_block f_l f_14')[0] as HTMLElement).innerText.replace(/[Ａ-Ｚａ-ｚ０-９]/g, (s: string) => {
        return String.fromCharCode(s.charCodeAt(0) - 65248)
      })
      const docs = await db
        .collection('users')
        .doc(this.uid)
        .collection('userData')
        .doc(this.uid)
        .get()
      let gotOldUserData
      if (docs && docs.exists) {
        gotOldUserData = docs.data()
      }
      let ratings = []
      if (gotOldUserData) {
        ratings = gotOldUserData.ratings || []
      }
      if ((ratings.length >= 1 && ratings[ratings.length - 1].rating !== Number(gotRating)) || ratings.length === 0) {
        ratings.push({ rating: Number(gotRating), date: date })
      }
      await db
        .collection('users')
        .doc(this.uid)
        .collection('userData')
        .doc(this.uid)
        .set(
          {
            ratings: ratings,
            maxRating: gotMaxRating,
            playCount: gotPlayCount,
            userName: gotUserName
          },
          { merge: true }
        )
    } catch (error) {
      console.error(error)

      if (error.response && error.response.data && error.response.data.match(/メンテナンス中/)) {
        this.message = 'maimaiでらっくすNETはメンテナンス中です。メンテナンス終了後に再度お試しください。'
        this.error = true
        this.isDisable = false
      }
    }
  }

  async logout () {
    await auth.logout()
    this.$emit('loginCheck')
  }

  async getTweetURL () {
    const doc = await db
      .collection('users')
      .doc(this.uid)
      .get()
    const userData = doc.data() as {public:boolean, displayName:string}
    this.publicData = userData.public
    this.tweetURL = `https://twitter.com/intent/tweet?text=スコア更新しました！&hashtags=舞スコア&url=https://mai-score.com/user/${userData.displayName}`
  }

  async createScoreImg (updateScoreData: any[]) {
    console.log(updateScoreData)
    updateScoreData.reverse()
    if (updateScoreData.length >= 20) {
      updateScoreData = updateScoreData.slice(0, 20)
    }
    let canvas = document.createElement('canvas')
    const height = 75 * updateScoreData.length
    canvas.width = 700
    canvas.height = height
    canvas.style.width = '700'
    canvas.style.height = `${height}`
    let ctx = canvas.getContext('2d')!
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, 700, height)
    ctx.fillStyle = 'black'
    let i = 0
    for (const v of updateScoreData) {
      console.log(v)
      try {
        const musicIconUrl = await firebase
          .storage()
          .ref()
          .child(`musicIcon/${encodeURIComponent(v.title)}.png`)
          .getDownloadURL()
        await loadImage(musicIconUrl)
      } catch (error) {
        if (error.code === 'storage/object-not-found') {
          const musicIconUrl = await this.saveMusicIcon(v.musicID)
          await loadImage(musicIconUrl)
        } else {
          console.error(error)
        }
      }
      ctx.font = `24px 'sans-serif'`
      const type = v.type === 'deluxe' ? 'DX' : 'Std'
      ctx.fillText(`[${v.difficultyLevel.slice(0, 3)}|${type}] ${v.title}`, 80, 30 * (i * 2 + 1) + 15 * i)
      let text
      let dxText
      if (v.achievements.length >= 2) {
        text = `${v.achievements.slice(-2)[0].achievement}%→${v.achievements.slice(-1)[0].achievement}%  +${(
          v.achievements.slice(-1)[0].achievement - v.achievements.slice(-2)[0].achievement
        ).toFixed(4)}%`
      } else {
        text = `0.0000%→${v.achievements.slice(-1)[0].achievement}%  +${v.achievements[0].achievement.toFixed(4)}%`
      }
      if (v.dxScores.length >= 2) {
        dxText = `${v.dxScores.slice(-2)[0].dxScore}→${v.dxScores.slice(-1)[0].dxScore}  +${v.dxScores.slice(-1)[0].dxScore - v.dxScores.slice(-2)[0].dxScore}`
      } else {
        dxText = `0→${v.dxScores.slice(-1)[0].dxScore}  +${v.dxScores[0].dxScore}`
      }
      ctx.font = `16px 'sans-serif'`
      ctx.fillText(text, 80, 30 * (i * 2 + 1) + 20 + 15 * i)
      ctx.fillText(dxText, 80, 30 * (i * 2 + 1) + 40 + 15 * i)
      ctx.fillText(`${v.rank}  ${v.comboRank || ''}  ${v.sync || ''}`, 270, 30 * (i * 2 + 1) + 40 + 15 * i)
      i++
    }
    const imgUrl = canvas.toDataURL('image/jpeg')
    // Firebase Storageに画像をアップロード
    try {
      const storageRef = firebase
        .storage()
        .ref(`userData/${this.uid}/`)
        .child('updateScore.jpg')
      const data = await storageRef.putString(imgUrl, 'data_url')
      console.log(data)
    } catch (error) {
      console.error(error)
    }
    function loadImage (src: string) {
      return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => {
          ctx.drawImage(img, 10, 10 + 75 * i, 60, 60)
          resolve()
        }
        img.onerror = e => reject(e)
        img.crossOrigin = 'anonymous'
        img.src = src
      })
    }
  }
  async saveMusicIcon (musicID: string) {
    const { data } = await Axios.get(`https://maimaidx.jp/maimai-mobile/record/musicDetail/?idx=${encodeURIComponent(musicID)}`)
    const domparser = new DOMParser()
    const tmpEl = domparser.parseFromString(data, 'text/html')
    const title = (tmpEl.getElementsByClassName('m_5 f_15 break')[0] as HTMLElement).innerText
    const musicImgUrl = (tmpEl.getElementsByClassName('w_180 m_5 f_l')[0] as HTMLImageElement).src
    const musicIcon = await Axios.get(musicImgUrl, { responseType: 'arraybuffer' })
    try {
      const storageRef = firebase
        .storage()
        .ref('musicIcon/')
        .child(`${encodeURIComponent(title)}.png`)
      const data = await storageRef.put(musicIcon.data, {
        contentType: 'image/png'
      })
      console.log(data)
    } catch (error) {
      console.error(error)
    }
    return musicImgUrl
  }
  tweetStatusUpdate (str: string) {
    console.log(str)
    this.tweetStatus = str
  }
  async getRecordData () {
    let gotOldChartData:any = { Basic: {}, Advanced: {}, Expert: {}, Master: {}, ReMaster: {} }
    for (const key in gotOldChartData) {
      const docs = await db
        .collection('chartData')
        .doc(key)
        .get()
      if (docs && docs.exists) {
        gotOldChartData[key] = docs.data()
      }
    }
    const { data } = await Axios.get('https://maimaidx.jp/maimai-mobile/record/')
    const domparser = new DOMParser()
    const tmpEl = domparser.parseFromString(data, 'text/html')
    const classList:any = tmpEl.getElementsByClassName('p_10 t_l f_0 v_b')
    console.log(classList)
    console.log(classList[0])
    let recordList:{}[] = []
    Array.prototype.forEach.call(classList, (el: any) => {
      const splitedMusicImgUrl = el.getElementsByClassName('music_img m_5 m_r_0 f_l')[0].src.split('/')
      const musicID = splitedMusicImgUrl[splitedMusicImgUrl.length - 1].split('.')[0]
      const title = el.getElementsByClassName('basic_block m_5 p_5 p_l_10 f_13 break')[0].innerText
      const tmpDifficultyLevel = el
        .getElementsByClassName('playlog_diff v_b')[0]
        .src.split('_')[1]
        .split('.')[0]
      const difficultyLevel = tmpDifficultyLevel === 'remaster' ? 'ReMaster' : tmpDifficultyLevel[0].toUpperCase() + tmpDifficultyLevel.slice(1)
      const idx = el.getElementsByTagName('input')[0].value
      const type = el.getElementsByClassName('playlog_music_kind_icon')[0].src.indexOf('standard.png') >= 0 ? 'standard' : 'deluxe'
      const payload = { musicID, title, difficultyLevel, idx, type }
      if (gotOldChartData[difficultyLevel][`${musicID}_${type}`] == null) {
        recordList.push(payload)
      }
    })
    // 重複を削除
    let tmpList: {}[] = []
    let deduplicationRecordList:any[] = recordList.filter((e:any) => {
      if (!(tmpList.indexOf(`${e['musicID']}${e['difficultyLevel']}${e['type']}`) >= 0)) {
        tmpList.push(`${e['musicID']}${e['difficultyLevel']}${e['type']}`)
        return e
      }
    })
    console.log(deduplicationRecordList)
    let chartDataList: any = { Basic: {}, Advanced: {}, Expert: {}, Master: {}, ReMaster: {} }
    try {
      const sleep = (msec:number) => new Promise(resolve => setTimeout(resolve, msec))
      const sum = (arr:any[]) => {
        return arr.reduce((prev, current, i, arr) => {
          return prev + current
        })
      }
      for (let i = 0; i < deduplicationRecordList.length; i++) {
        const idx = deduplicationRecordList[i].idx
        delete deduplicationRecordList[i].idx
        const { data } = await Axios.get(`https://maimaidx.jp/maimai-mobile/record/playlogDetail/?idx=${idx}`)
        const domparser = new DOMParser()
        const tmpEl = domparser.parseFromString(data, 'text/html')
        deduplicationRecordList[i].maxCombo = Number((tmpEl.getElementsByClassName('f_r f_14 white')[0] as HTMLElement).innerText.split('/')[1])
        const rawNotes = (tmpEl
          .getElementsByClassName('playlog_notes_detail t_r f_l f_11 f_b')[0] as HTMLElement)
          .innerText.trim()
          .split(/\t+|\n/)
          .filter(v => v !== '')
        let notes: number[][] = [[], [], [], [], []]
        let cnt = 0
        let index = 0
        for (let j = 0; j < rawNotes.length; j++) {
          if (rawNotes[j] === '　') {
            notes[cnt] = [0]
            cnt++
          } else {
            notes[cnt].push(Number(rawNotes[j]))
            index++
            if (index >= 5) {
              cnt++
              index = 0
            }
          }
        }
        deduplicationRecordList[i].notes = { tap: sum(notes[0]), hold: sum(notes[1]), slide: sum(notes[2]), touch: sum(notes[3]), break: sum(notes[4]) }
        chartDataList[deduplicationRecordList[i].difficultyLevel][`${deduplicationRecordList[i].musicID}_${deduplicationRecordList[i].type}`] = deduplicationRecordList[i]
        if (i % 10 === 0) await sleep(1000)
      }
    } catch (error) {
      console.error(error)
    }
    for (const key in chartDataList) {
      db.collection('chartData')
        .doc(key)
        .set(chartDataList[key], { merge: true })
        .catch(e => {
          console.error(e)
        })
    }
  }
  async getFirstVersion () {
    let versionMusicList = []
    const docs = await db
      .collection('musicData')
      .doc('Master')
      .get()
    if (docs && docs.exists) {
      let tmp: any = docs.data()
      versionMusicList = tmp.data || []
    }
    const domparser = new DOMParser()
    const { data } = await Axios.get('https://maimaidx.jp/maimai-mobile/record/musicVersion/')
    const doc = domparser.parseFromString(data, 'text/html')
    const optionCnt = doc.getElementsByClassName('w_300 m_10')[0].childElementCount
    const sleep = (msec: number) => new Promise(resolve => setTimeout(resolve, msec))
    // maimaiでらっくすのパラメータは13
    for (let i = 13; i < optionCnt; i++) {
      const { data } = await Axios.get(`https://maimaidx.jp/maimai-mobile/record/musicVersion/search/?version=${i}&diff=3`)
      const tmpEl = domparser.parseFromString(data, 'text/html')
      const version = (tmpEl.getElementsByClassName('screw_block m_15 f_15')[0] as HTMLElement).innerText.replace(' ', '_')
      const musicElList = tmpEl.getElementsByClassName('music_master_score_back pointer w_450 m_15 p_3 f_0')
      for (let j = 0; j < musicElList.length; j++) {
        let title = (musicElList[j].getElementsByClassName('music_name_block t_l f_13 break')[0] as HTMLElement).innerText
        const type = (tmpEl.getElementsByClassName('music_kind_icon f_r')[0] as HTMLImageElement).src.indexOf('dx.png') >= 0 ? 'deluxe' : 'standard'
        if (versionMusicList.find((v: any) => v.title === title && v.type === type && v.version === version) == null) {
          const idx = musicElList[j].getElementsByTagName('input')[0].value
          const { data } = await Axios.get(`https://maimaidx.jp/maimai-mobile/record/musicDetail/?idx=${encodeURIComponent(idx)}`)
          const tmpEl = domparser.parseFromString(data, 'text/html')
          const splitedMusicImgUrl = (tmpEl.getElementsByClassName('w_180 m_5 f_l')[0] as HTMLImageElement).src.split('/')
          const songID = splitedMusicImgUrl[splitedMusicImgUrl.length - 1].split('.')[0]
          const genre = (tmpEl.getElementsByClassName('m_10 m_t_5 t_r f_12 blue')[0] as HTMLElement).innerText.trim()
          if (versionMusicList.find((v: any) => v.songID === songID && v.type === type && v.genre === genre) != null) {
            await sleep(500)
            continue
          }
          const artist = (tmpEl.getElementsByClassName('m_5 f_12 break')[0] as HTMLElement).innerText.trim()
          versionMusicList.push({ title, version, genre, type, songID, artist })
          await sleep(500)
        }
      }
    }
    console.log(versionMusicList)
    this.versionMusicList = versionMusicList
    db.collection('musicData')
      .doc('Master')
      .set({ data: versionMusicList }, { merge: true })
      .catch(e => {
        console.error(e)
      })
  }
}
</script>

<style lang="scss" scoped>
#addScoreData {
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
  p {
    display: block;
    margin-block-start: 1em;
    margin-block-end: 1em;
    margin-inline-start: 0px;
    margin-inline-end: 0px;
  }
  margin: 10px;
  .addScoreDataMain {
    text-align: center;
    .error {
      color: red;
    }
    .addDataBtn {
      padding: 0.3em 1em;
      text-decoration: none;
      color: #0097A7;
      border: solid 2px #0097A7;
      border-radius: 3px;
      transition: .4s;
      background: white;
      cursor: pointer;
      font-size: 18px;
    }
    .addDataBtn:hover {
      background: #00ACC1;
      color: white;
    }
    .disableBtn {
      cursor: not-allowed;
      background: #00ACC1;
      color: white;
    }
  }
  #logout {
    display: block;
    margin: 0 0 0 auto;
  }
  .tweetLink {
    display: flex;
    justify-content: space-around;
  }
}
</style>
