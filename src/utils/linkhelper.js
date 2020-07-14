// import axios from 'axios'
// import { Message, MessageBox } from 'element-ui'
// import { authorizationValue } from '@/settings'
// import store from '@/store/index'
// import router from '@/router'
// import { getToken, getRefreshToken, getExpireTime } from '@/utils/auth'
// import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import request from '@/utils/request'
const { DSLink } = require('dslink/js/web')

// 系统全局请求对象
var dsalink = null

const linkhelper = {
  refreshAuth: function(cb, node, resolve) {
    if (this.$link && this.$link.status) {
      this.$link.close()
    }
    request.get('jsconn').then(async(r) => {
      if (r.data) {
        this.auth = r.data

        // const url = 'ws://'+window.location.host+'/ws?auth=' + this.auth.auth + '&dsId=' + this.auth.dsId
        const url = 'ws://' + window.location.hostname + ':' + this.auth.port + '/ws?auth=' + this.auth.auth + '&dsId=' + this.auth.dsId
        dsalink = new DSLink(url, 'json')
        dsalink.connect()
        if (cb) {
          cb(node, resolve)
        }
      }
    })
  },
  getInvoke: (node) => {
    var ivks = []
    if (node) {
      if (node.children) {
        for (var element of node.children) {
          if (element[1].get('$invokable')) {
            ivks.push(element[1])
          }
        }
      }
    }
    return ivks
  },
  getAttribute: (node) => {
    var attrs = []
    if (node) {
      if (node.children) {
        for (var element of node.children) {
          if (!(element[1].getConfig('$type') || element[1].getConfig('$datatype'))) {
            continue
          }
          if (element[1].getConfig('$datatype') || element[1].getConfig('$type') === 'dynamic' || element[1].getConfig('$type') === 'string' || element[1].getConfig('$type') === 'number' || element[1].getConfig('$type').startsWith('bool')) {
            attrs.push(element[1])
          }
        }
      }
    }
    return attrs
  },
  getInvokeAttr(rnode) {
    var ret = []
    if (rnode.getConfig('$params')) {
      rnode.getConfig('$params').forEach(element => {
        var matchs = element.type.match(/(^enum\[)(.+)(\])/)
        if (matchs && matchs.length > 2) {
          element.type = 'enum'
          element.enums = matchs[2].split(',')
        }
        ret.push(element)
      })
    }
    return ret
  }
}

// function saveData(data) {
//   store.commit('account/setAccessToken', data.access_token)
//   store.commit('account/setRefreshToken', data.refresh_token)
//   const current = new Date()
//   const expireTime = current.setTime(current.getTime() + 1000 * data.expires_in)
//   store.commit('account/setExpireTime', expireTime)
// }

export default linkhelper
