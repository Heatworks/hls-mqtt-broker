var mocha = require("mocha")
var mqtt = require("mqtt")

return; // Skip

describe("connect", () => {
    it ("should connect to broker", (done) => {
        client = mqtt.connect("ws://10.1.10.126:1884", {
            username: 'wcatron',
            password: 'secret',
           reconnectPeriod: 500 * 1
        })
       
        count = 0
        var waitFor = setTimeout(() => {
            if (count == 1) {
                done()
            } else {
                done(count)
            }
        }, 4800)
        client.on('connect', (packet) => {
            count++
            if (count > 1) {
                clearTimeout(waitFor);
                done(count)
            }
        })
        client.on('offline', () => {
            done("Fell offline!")
        })
       
    }).timeout(5000);
})