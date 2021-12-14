//"echo \"Error: no test specified\" && exit 1"

const newLineChar = process.platform === 'win32' ? '\r\n' : '\n';
let   bankrupts   = [];

import axios from 'axios';
import { queue as _queue } from 'async';
import * as fs from 'fs';


function* generateOffset(start, end) {
  
  while (start <= end) {
    yield start;
    start += 15;
  }

  if (start === 510) yield 500

}


let axios_config = {  
  method: 'get',
  headers: {
    'referer': 'https://bankrot.fedresurs.ru/bankrupts',
  }
};


const queue = _queue((task, completed) => {
  
  console.log("Currently busy processing task: " + task);

  axios.get(`https://bankrot.fedresurs.ru/backend/prsnbankrupts?limit=15&offset=${task}`, axios_config)
    .then(function (response) {

      const remaining = queue.length();
      console.log(`${newLineChar}${response.data.pageData.length} individual bankrupts were obtained!`);

      let prsnbankrupts = JSON.stringify(response.data.pageData);

      completed(null, {task, remaining, prsnbankrupts});

    })
    .catch(function (error) {
      console.log(error);
    });

}, 1); 


queue.drain(() => {
  
  let guid = new Set();

  let prsnbankrupts = bankrupts.filter(function(bankrupt) {

    if (guid.has(bankrupt["guid"])) return false
    
    guid.add(bankrupt["guid"]);
    return true
  });

  console.log(`${newLineChar}Successfully processed all tasks! The total number of bankrupts: ` + prsnbankrupts.length);
  
  fs.writeFileSync("prsnbankrupts.json", JSON.stringify(prsnbankrupts))

})



for (let task of generateOffset(0, 500)) {

  queue.push(task, (error, {task, remaining, prsnbankrupts}) => {
    if (error) {
      console.log(`${newLineChar}An error occurred while processing task ${task}`);
    } else {
      console.log(`${newLineChar}Finished processing task ${task}. ${remaining} tasks remaining!`);

      bankrupts = bankrupts.concat(JSON.parse(prsnbankrupts));
    }
  })

}