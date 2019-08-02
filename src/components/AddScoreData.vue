<template>
  <div id="addScoreData">
    <button id="logout" @click="logout">ログアウト</button>
    <div class="addScoreDataMain">
      <p>舞スコア データ取得ツール</p>
      <button class="addDataBtn" @click="getData">舞スコアへデータ登録</button>
      <p v-if="message" :class="{ error: error }">{{ message }}</p>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import auth from '@/plugins/auth'
import { db } from '@/plugins/firestore'
import Axios from 'axios'

@Component
export default class addScoreData extends Vue {
  message = ''
  error = false
  @Prop({ default: '' })
  uid?: string;

  async getData () {
    this.error = false
    this.message = 'データ取得準備中...'
    const date = Date.now()
    const difficultyLevel = ['Basic', 'Advanced', 'Expert', 'Master', 'ReMaster']
    let scoreData: any = []
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
        if (data.match(/ログインしてください/)) {
          this.message = 'maimaiでらっくすNETにログインしていません。ログインしてから再度お試しください。'
          this.error = true
          return
        }
        const tmpEl = document.createElement('div')
        tmpEl.innerHTML = data
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
          const type = classList[j].lastElementChild.src.indexOf('standard.png') >= 0 ? 'standard' : 'deluxe'
          let oldAchievement = []
          let oldDxScore = []
          if (gotOldScore && gotOldScore[`${tmp[1]}_${difficultyLevel[i]}_${type}`]) {
            oldAchievement = gotOldScore[`${tmp[1]}_${difficultyLevel[i]}_${type}`].achievement || []
            oldDxScore = gotOldScore[`${tmp[1]}_${difficultyLevel[i]}_${type}`].dxScore || []
            musicUpdateDate = gotOldScore[`${tmp[1]}_${difficultyLevel[i]}_${type}`].date || date
          } else {
            musicUpdateDate = date
          }
          if ((oldAchievement.length >= 1 && oldAchievement[oldAchievement.length - 1].score !== Number(tmp[2].replace('%', ''))) || (oldAchievement.length === 0 && tmp[2])) {
            oldAchievement.push({ achievement: Number(tmp[2].replace('%', '')), date: date })
            musicUpdateDate = date
          }
          if ((oldDxScore.length >= 1 && oldDxScore[oldDxScore.length - 1].score !== Number(tmp[3].replace(',', ''))) || (oldDxScore.length === 0 && tmp[3])) {
            oldDxScore.push({ dxScore: Number(tmp[3].replace(',', '')), date: date })
            musicUpdateDate = date
          }
          const achievements = tmp[2] ? oldAchievement : null
          const dxScores = tmp[3] ? oldDxScore : null
          scoreData[difficultyLevel[i]][`${tmp[1]}_${difficultyLevel[i]}_${type}`] = {
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
            musicID: classList[j].getElementsByTagName('input')[0].value
          }
        }
      } catch (error) {
        console.error(error.data)
        if (error.response && error.response.data && error.response.data.match(/メンテナンス中/)) {
          this.message = 'maimaiでらっくすNETはメンテナンス中です。メンテナンス終了後に再度お試しください。'
          this.error = true
          return
        }
        continue
      }
    }
    console.log(scoreData)
    await this.getFetchUserData(date)
    this.message = 'データ保存中...'
    for (let i = 0; i < difficultyLevel.length; i++) {
      db.collection('users')
        .doc(this.uid)
        .collection('scores')
        .doc(difficultyLevel[i])
        .set(scoreData[difficultyLevel[i]], { merge: true })
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
    this.message = 'データ保存完了！'
  }

  async getFetchUserData (date: number) {
    this.message = 'ユーザデータを読み込み中...'
    try {
      const { data } = await Axios.get('https://maimaidx.jp/maimai-mobile/playerData/')
      const element = document.createElement('div') as any
      element.innerHTML = data
      if (data.match(/ログインしてください/)) {
        this.message = 'maimaiでらっくすNETにログインしていません。ログインしてから再度お試しください。'
        this.error = true
      }
      const gotRating = element.getElementsByClassName('rating_block f_11')[0].innerText
      const gotMaxRating = Number(element.getElementsByClassName('p_r_5 f_11')[0].innerText.split('：')[1])
      const gotPlayCount = Number(
        element
          .getElementsByClassName('m_5 m_t_10 t_r f_12')[0]
          .innerText.split('：')[1]
          .split('回')[0]
      )
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
        ratings = gotOldUserData.rating || []
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
            playCount: gotPlayCount
          },
          { merge: true }
        )
    } catch (error) {
      console.error(error)

      if (error.response && error.response.data && error.response.data.match(/メンテナンス中/)) {
        this.message = 'maimaiでらっくすNETはメンテナンス中です。メンテナンス終了後に再度お試しください。'
        this.error = true
      }
    }
  }

  async logout () {
    await auth.logout()
    this.$emit('loginCheck')
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
  }
  #logout {
    display: block;
    margin: 0 0 0 auto;
  }

}
</style>
