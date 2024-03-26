console.log('working')

const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const path = require('path');
const url = require('url');

let win;

// const fs = require('fs');
// const axios = require('axios');

// function getAllCities(url) {
//     return axios.get(url, {
//       headers: {
//         'X-RapidAPI-Key': '544ab5c1d1msh21eb38ee3d08c9ap1c3972jsn80695f100c3d',
//         'X-RapidAPI-Host': 'wft-geo-db.p.rapidapi.com'
//       }
//     }).then(response => response.data);
//   }
  
//   function getAllDataCit() {
//     let allData = [];
//     let i = 1;
//     function getNextPage(url) {
//       return new Promise(resolve => {
//         setTimeout(() => {
//           getAllCities(url).then((response) => {
//             allData = allData.concat(response.data);
//             const nextLink = response.links.find(link => link.rel === 'next');
//             if (nextLink) {
//               console.log(i++);
//               resolve(getNextPage(`https://wft-geo-db.p.rapidapi.com${nextLink.href}`));
//             } else {
//               resolve(allData);
//             }
//           });
//         }, 1500);
//       });
//     }
//     return getNextPage(`https://wft-geo-db.p.rapidapi.com/v1/geo/cities?types=CITY&countryIds=Q184&minPopulation=5000&languageCode=ru`);
//   }
  
//   getAllDataCit().then((allData) => {
//     console.log(allData);
//     fs.writeFile('output.json', JSON.stringify(allData), (err) => {
//       if (err) throw err;
//       console.log('The file has been saved!');
//     });
//   });

function createWin() {
            win = new BrowserWindow({
                show: false,
                autoHideMenuBar: true,
            });
            win.maximize();
            win.show();
    win.loadURL(url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file',
        slashes: true
    }));

    // win.webContents.openDevTools();

    win.on('closed', () => {
        win = null;
    })
}

app.on('ready', createWin);