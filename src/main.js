/*
    TO-DO:
     [x] use an array or object to store settings variables
     [x] save settings when app quits
     [x] add custom proxy support
     [x] create function to process settingsData
     [x] add in-app settings
     [x] make settings beautiful
     [x] add 'already saved' to settings
     [x] add about page
     [] find and fix cause of extreme long loading time.
     [x] adjust theme for TweetDecks awful color choice.
     [x] rework old theme
     [x] add theme selection
     [] find motivation to work on this list
     [] find a way to include Tor in linux
     [] write install script for linux
*/
const {remote,BrowserWindow,app,electron,shell,Menu,MenuItem,clipboard,dialog,ipcMain} = require('electron')
const fs = require('fs')

let Settings = [
  [undefined,'use-tor ='],
  [false,'use-round-pics ='],
  [0,'theme ='],//0 = no theme, 1 = Truly Dark, 2 = Dreamy Blue
  [1320,'width ='],
  [720,'height ='],
  [false,'use-custom-proxy ='],
  ['foopy:80','customProxy =']
]

const settingsFile = "./settings.json"
const tor = "./resources/app.asar.unpacked/tor-win32/Tor/tor.exe"
let mainWindow,settingsWin,twitterwin,aboutWin

function createWindow (Settings) {
  mainWindow = new BrowserWindow({autoHideMenuBar: true,width: Settings[3][0], height: Settings[4][0], minWidth: 371, minHeight:200})
  console.log(Settings)
  const url2 = 'file://' + app.getAppPath() +'/fail.html'
  const home = 'https://tweetdeck.twitter.com/'
  var retries = 0
  if(Settings[0][0] && !Settings[5][0])
  {
    mainWindow.webContents.session.setProxy({proxyRules:"socks5://127.0.0.1:9050"}, () => {
      mainWindow.loadURL(home)
      console.log("using Tor")
    })
  }
  else if(Settings[5][0])
  {
    mainWindow.webContents.session.setProxy({proxyRules: Settings[6][0]}, () => {
      mainWindow.loadURL(home)
      console.log("using custom Proxy")
    })
  }
  else {
    mainWindow.loadURL(home)
    console.log("Not using Tor or custom Proxy")
  }
  mainWindow.webContents.on('did-fail-load', () => {
    console.log("failed to load. Retrying...")
    mainWindow.loadURL(home)
    if(retries==3) {
      mainWindow.loadURL(url2)
      console.log("failed to load")
    }
    retries++
  })
  mainWindow.webContents.on('did-finish-load', () => {
    if(!Settings[1][0])
    {
      mainWindow.webContents.insertCSS(".avatar{border-radius:0 !important}")// makes profile pics angular shaped again Woohoo!
      console.log("inserted code for angular profile pics")
    }
    if(Settings[2][0]==1 && mainWindow.webContents.getURL().search("https://tweetdeck.twitter.com/") == 0)
    {
      //First: Overall appearance (Tweets, sidebar etc.)
      //Second: Column options
      //Third: Search Tips
      //Fourth: Keyboard shortcuts
      //Last: Old stuff that needs sorting (everything else)
      mainWindow.webContents.insertCSS("\
      html.dark .stream-item{background-color: #222426 !important}\
      html.dark .column-nav-item{background-color: #292f33 !important}\
      html.dark .app-header{background-color: #292f33 !important}\
      html.dark .app-navigator{background-color: #292f33 !important}\
      html.dark .app-title{background-color: #292f33 !important}\
      html.dark .column-header, html.dark .column-header-temp{background-color: #292f33 !important}\
      html.dark .column-message{background-color: #292f33 !important}\
      html.dark .app-content{background-color: #222426 !important}\
      html.dark .column{background-color: #222426 !important}\
      html.dark .app-columns-container{background-color: #14171a !important}\
      \
      html.dark .column-options{background-color: #2a2c2d !important}\
      html.dark .column-options .button-tray{background-color: #2a2c2d !important}\
      html.dark .is-options-open .column-settings-link{background-color: #2a2c2d !important}\
      html.dark .facet-type.is-active{background-color: #2a2c2d !important}\
      \
      html.dark .bg-color-twitter-white{background-color: #222426 !important}\
      html.dark .color-twitter-dark-gray{color: #fff !important}\
      html.dark .hover-bg-color-twitter-faint-blue:hover, html.dark .hover-bg-color-twitter-faint-blue:focus{background-color: #111 !important}\
      html.dark .Button{background-color: #111 !important}\
      html.dark .Button:hover{background-color: #111 !important}\
      \
      html.dark .color-twitter-dark-black{color: #fff !important}\
      \
      html.dark .is-inverted-dark .accordion .is-active{color: #e1e8ed !important}\
      .txt-twitter-dark-black{color: #999 !important}\
      html.dark .list-filter{color: #fff !important}\
      html.dark .bg-twitter-faint-gray{background-color: #222426 !important}\
      html.dark .bg-color-twitter-lightest-gray{background-color: #222426 !important}\
      .cmp-replyto{background-color: #222426 !important}\
      .is-inverted-dark .scroll-conversation{background: #222426 !important}\
      .mdl.s-full{background-color: #111 !important}\
      .mdl-placeholder{text-shadow: 0 1px 0 rgba(0, 0, 0, 0.8) !important}\
      .list-account .username{color: #eaeaea !important}\
      .list-account .fullname{color: #eaeaea !important}\
      .list-account:hover{background-color: #666 !important}\
      .list-account{text-shadow: 0 1px 0 #000 !important}\
      .is-inverted-dark .column-scroller::-webkit-scrollbar-thumb{background-color: #666 !important}\
      .column-background-fill{background-color: #222426 !important}\
      .scroll-alt::-webkit-scrollbar-thumb{background-color: #666 !important}\
      .is-inverted-dark .stream-item{background-color: #222426 !important}\
      .is-inverted-dark .account-link{color: #e1e8ed !important}\
      .follow-btn{background-color: #292f33 !important;color: #fff !important;border-color: #111 !important}\
      .s-following .follow-btn{background-color: #50a5e6 !important}\
      .s-following .follow-btn:hover{color:#fff !important;background-color:#a0041e !important}\
      .is-inverted-dark .btn-square:focus{color: #eaeaea !important;background-color: #292f33 !important}\
      .is-inverted-dark .btn-square{color: #e1e8ed !important;background-color: #292f33 !important;border-color: #111 !important} \
      .lst-profile{background-color: #2a2c2d !important}\
      .text-like-keyboard-key{color: #000 !important}\
      html.dark .social-proof-container{background-color: #222426 !important}\
      .is-inverted-dark{color: #fff !important}\
      .prf-stats a strong{color: #8899a6 !important}\
      .caret-inner{border-bottom: 6px solid #222426 !important}\
      .bg-r-white,.prf-meta{background-color: #222426 !important}\
      .txt-seamful-black{color: #fff !important}\
      .dropdown-menu,.dropdown-menu [data-action]{background-color: #222426 !important;color: #fff !important}\
      .list-link:hover{background-color: #0e0e0e !important}\
      .mdl,.mdl-inner,.mdl-column,.mdl-col-settings,.bg-seamful-faint-gray,.bg-seamful-faded-gray{background-color: #222426 !important}\
      .frm,.a-list-link,.list-link,.mdl-header,.mdl-dismiss,.non-selectable-item{color: #fff !important}")
      console.log("inserted code for dark theme")
    }
    if(Settings[2][0]==2 && mainWindow.webContents.getURL().search("https://tweetdeck.twitter.com/") == 0)
    {
      //First: Dropdown menu (Settings, account actions)
      //Second: Keyboard shortcuts
      //Third: Settings
      //Fourth: Search
      //Fifth: Profile
      //Sixth: Profile -> Tweets, Mentions, Lists etc.
      //Seventh: Tweets (Pictures, Videos)
      mainWindow.webContents.insertCSS("\
      html.dark .dropdown-menu{background-color: #243447 !important}\
      html.dark .non-selectable-item{color: #e1e8ed !important}\
      html.dark .dropdown-menu .typeahead-item, html.dark .dropdown-menu [data-action]{color: #e1e8ed !important}\
      \
      html.dark .mdl{background-color: #243447 !important}\
      html.dark .text-like-keyboard-key{color: #292f33 !important}\
      html.dark .keyboard-shortcut-list{color: #e1e8ed !important}\
      html.dark .mdl-header{color: #e1e8ed !important}\
      html.dark .mdl-dismiss{color: #e1e8ed !important}\
      .txt-r-deep-gray{color: #e1e8ed !important}\
      .bg-r-white{background-color: #243447 !important}\
      \
      html.dark .mdl-col-settings{background-color: #243447 !important}\
      html.dark .frm{color: #e1e8ed !important}\
      html.dark .bg-color-twitter-lightest-gray{background-color: #243447 !important}\
      html.dark .is-inverted-dark .list-link{color: #e1e8ed !important}\
      html.dark .list-filter{color: #e1e8ed !important}\
      html.dark .list-link:hover:hover{color: #e1e8ed !important; background-color: #1B2836 !important}\
      \
      html.dark .is-inverted-dark .accordion .is-active{color: #e1e8ed !important}\
      .txt-twitter-dark-black{color: #e1e8ed !important}\
      html.dark .is-inverted-dark{color: #e1e8ed !important}\
      html.dark .popover{background-color: #243447 !important}\
      .caret-inner{border-bottom: 6px solid #243447 !important}\
      html.dark .list-item{color: #e1e8ed !important}\
      html.dark .bg-color-twitter-white{background-color: #243447 !important}\
      html.dark .color-twitter-dark-gray{color:#fff !important}\
      html.dark .hover-bg-color-twitter-faint-blue:hover, html.dark .hover-bg-color-twitter-faint-blue:focus{background-color: #1B2836 !important}\
      html.dark .Button{background-color: #1B2836 !important}\
      html.dark .Button:hover{background-color: #1B2836 !important}\
      \
      html.dark .prf-meta{background-color: #1B2836 !important}\
      html.dark .prf-stats a strong{color: #e1e8ed !important}\
      html.dark .social-proof-container{background-color: #1B2836 !important}\
      html.dark .is-inverted-dark .btn:hover, html.dark .is-inverted-dark .btn:focus{background-color: #243447 !important}\
      \
      html.dark .mdl-column-med{background: #243447 !important}\
      html.dark .mdl-column-rhs{background: #243447 !important}\
      html.dark .is-inverted-dark .stream-item{background-color: #1B2836 !important}\
      html.dark .is-inverted-dark .account-link{color: #e1e8ed !important}\
      html.dark .list-account .fullname{color: #e1e8ed !important}\
      html.dark .column-background-fill{background-color: #243447 !important}\
      html.dark .is-inverted-dark .scroll-conversation{background: #1B2836 !important}\
      \
      html.dark .med-fullpanel{background-color: #111 !important}\
      ")
      console.log("inserted code for blue theme")
    }
  })
  mainWindow.webContents.on('new-window', (event,url) => {
    if(url.search('https://tweetdeck.twitter.com/') !== 0 || url.search('https://twitter.com/') !== 0)
    {
      event.preventDefault()
      shell.openExternal(url)
      console.log("opened link external")
    }
  })
  mainWindow.webContents.on('will-navigate', (event, url) => {

    if(url.search('https://twitter.com/login') == 0)
    {
      event.preventDefault()
      twitterwin = new BrowserWindow({parent: mainWindow})
      twitterwin.setMenu(null)
      if(Settings[0][0] && !Settings[5][0])
      {
        twitterwin.webContents.session.setProxy({proxyRules:"socks5://127.0.0.1:9050"}, () => {
          twitterwin.loadURL(url)
          console.log("using Tor")
        })
      }
      else if(Settings[5][0])
      {
        twitterwin.webContents.session.setProxy({proxyRules: Settings[6][0]}, () => {
          twitterwin.loadURL(url)
          console.log("using custom Proxy")
        })
      }
      else {
        twitterwin.loadURL(url)
        console.log("Not using Tor or custom Proxy")
      }
      twitterwin.webContents.on('did-fail-load',() => {
        twitterwin.loadURL(url2)
        console.log("failed to load")
      })
      event.newGuest = twitterwin
      twitterwin.webContents.on('will-navigate', (event,url) => {
        mainWindow.loadURL(url)
        twitterwin.close()
      })
    }
  })
  mainWindow.on('close', (event) => {
    SaveSettings(Settings)
  })
  mainWindow.on('closed', function () {
    app.quit()
  })
  ipcMain.on('Settings',(event,newSettings) => {
    console.log(newSettings)
    if(newSettings.toString() == Settings.toString())
    {
      event.returnValue = false
    }
    else {
      var reload = false
      if(Settings[2][0]!==newSettings[2][0])
      {
        reload = true
      }
      Settings = newSettings
      if(reload){
        mainWindow.reload()
      }
      SaveSettings(Settings)
      event.returnValue = true
    }
    console.log(Settings)
  })
}
function startTor() {
  if(process.platform == 'win32')
  {
    var child = require('child_process').execFile(tor)
    console.log("started Tor")
  }
}
function SaveSettings(Settings){
  const size = mainWindow.getSize()
  Settings[3][0] = size[0]//width
  Settings[4][0] = size[1]//height
  var saveSettings = ""
  for(var i=0;i<Settings.length;i++)
  {
    saveSettings += (Settings[i][1] + Settings[i][0] + '\n')
  }
  fs.writeFileSync(settingsFile,saveSettings, (err) =>{
    if(err) return console.log(err)
  })
}

app.on('ready', () => {
app.commandLine.appendSwitch('disable-gpu-compositing')//fixes blank screen bug... fucking hell...
  if(!fs.existsSync(settingsFile))
  {
    dialog.showMessageBox({type:'question', buttons:['No','Yes'],message:'Do you want to use Tor?'}, (response)=>{
      if(response){
        Settings[0][0] = true
        var saveSettings = ""
        for(var i=0;i<Settings.length;i++)
        {
          saveSettings += (Settings[i][1] + Settings[i][0] + '\n')
        }
        fs.writeFileSync(settingsFile,saveSettings, (err) =>{
          if(err) return console.log(err)
          else return console.log("wrote file")
        })
        console.log("clicked YES")
        startTor()
        createWindow(Settings)
        }
      else {
        Settings[0][0] = false
        var saveSettings = ""
        for(var i=0;i<Settings.length;i++)
        {
          saveSettings += (Settings[i][1] + Settings[i][0] + '\n')
        }
        fs.writeFileSync(settingsFile,saveSettings, (err) =>{
          if(err) return console.log(err)
          else return console.log("wrote file")
        })
        console.log("clicked NO")
        createWindow(Settings)
      }
    })
  }
  else if(fs.existsSync(settingsFile)) {
    const settingsData= fs.readFileSync(settingsFile,'utf8')
    console.log("Data:\n" + settingsData + "\nend of data")

    for(var i=0;i<Settings.length;i++)
    {
      Settings[i][0] = settingsData.slice(settingsData.search(Settings[i][1])+Settings[i][1].length,settingsData.indexOf('\n',settingsData.search(Settings[i][1]))).trim()
      if(Settings[i][0] == 'true'||Settings[i][0] == 'false')
      {
        Settings[i][0] = (Settings[i][0] == 'true')
      }
      else if(!isNaN(Number(Settings[i][0]))){
        Settings[i][0] = Number(Settings[i][0])
      }
    }
    console.log(Settings)
      if(Settings[0][0] && !Settings[1][0])
      {
        startTor()
      }
      createWindow(Settings)
  }
  else { //unreachable code, but... you know
    console.log("Something went terribly wrong")
  }
  createMenu()
})
app.on('browser-window-created', function (event, win) {

  win.webContents.on('context-menu', function (e, params) {
    const cmenu = new Menu()
    if(params.linkURL && params.mediaType === 'none')
    {
      cmenu.append(new MenuItem({
        label: 'Copy URL',
        click () {
          clipboard.writeText(params.linkURL)
        }
      }))
      if(params.linkText.charAt(0) === '#')
      {
        cmenu.append(new MenuItem({
          label: 'Copy Hashtag',
          click () {
            clipboard.writeText(params.linkText)
          }
        }))
      }
      if(params.linkText.charAt(0) === '@')
      {
        cmenu.append(new MenuItem({
          label: 'Copy Username',
          click () {
            clipboard.writeText(params.linkText)
          }
        }))
      }
    }
    else if(params.mediaType === 'image')
    {
      cmenu.append(new MenuItem({
        label: 'Copy Image',
        click () {
          win.webContents.copyImageAt(params.x,params.y)
        }
      }))
    }
    else if(params.mediaType === 'none'){
      cmenu.append(new MenuItem({role: 'copy'}))
      cmenu.append(new MenuItem({label:'Paste', role: 'pasteandmatchstyle'}))
      cmenu.append(new MenuItem({role: 'cut'}))
      cmenu.append(new MenuItem({role: 'selectall'}))
    }
    else {
      cmenu.append(new MenuItem({label:'...'}))
    }
    cmenu.popup(win, params.x, params.y)
  })
})

app.on('window-all-closed', function () {
    app.quit()
})
function createMenu() {
  if (Menu.getApplicationMenu()) return

  const template = [
    {
      label: 'App',
      submenu: [
        {
          role: 'quit'
        },
        {
          label: 'Settings',
          click () {
            if(settingsWin != undefined) settingsWin.focus()
            else {
              settingsWin = new BrowserWindow({width: 450,height: 310,parent: mainWindow})
              settingsWin.setMenu(null)
              settingsWin.loadURL('file://' + app.getAppPath() + '/settings.html')
            }
            settingsWin.on('closed', () => {
              settingsWin = undefined
            })
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        {
          role: 'cut'
        },
        {
          role: 'copy'
        },
        {
          label:'Paste',
          accelerator: 'CmdOrCtrl+V',
          role: 'pasteandmatchstyle'
        },
        {
          role: 'selectall'
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'TweetDeck',
          click (item, focusedWindow) {
            if (focusedWindow) focusedWindow.loadURL("https://tweetdeck.twitter.com/")}
        },
        {
          label: 'Twitter',
          click (item, focusedWindow) {
            if(focusedWindow) focusedWindow.loadURL("https://twitter.com/")}
        },
        {
          label: 'Reload',
          accelerator: 'F5',
          click (item, focusedWindow) {
            if (focusedWindow) focusedWindow.reload()
          }
        },
        {
          label: 'DevTools',
          accelerator: 'F12',
          click (item, focusedWindow){
            if(focusedWindow) focusedWindow.webContents.toggleDevTools()
          }
        },
        {
          role: 'togglefullscreen'
        }
      ]
    },
    {
      label: 'About',
      click(){
        if(aboutWin != undefined) aboutWin.focus()
        else {
          aboutWin = new BrowserWindow({width: 500,height: 300,parent: mainWindow})
          aboutWin.setMenu(null)
          aboutWin.loadURL('file://' + app.getAppPath() + '/about.html')
        }
        aboutWin.on('closed', ()=> {
          aboutWin = undefined
        })
        aboutWin.webContents.on('will-navigate', (event,url) => {
          event.preventDefault()
          shell.openExternal(url)
        })
      }
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}
