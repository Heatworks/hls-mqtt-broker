var oneLevelHigher = require("../src/iam_policy").oneLevelHigher

var mocha = require("mocha")
var assert = require("assert")

describe("oneLevelHigher", () => {
    it("should got to any action", () => {
        assert.equal(oneLevelHigher("hls:dac:Publish", ":"), "hls:dac:*")
    })
    it("should go to any service", () => {
        assert.equal(oneLevelHigher("hls:dac:*", ":"), "hls:*")
    })
    it("should be false", () => {
        assert.equal(oneLevelHigher("hls:*", ":"), false)
    })
    it ("should technically just keep going down", () => {
        assert.equal(oneLevelHigher("hls:iam:AccessToken:PUT", ":"), "hls:iam:AccessToken:*")
    })
    it ("should work with resource divider", () => {
        assert.equal(oneLevelHigher("/organizations/heatworks/devices/{deviceName}/{channelName}", "/"), "/organizations/heatworks/devices/{deviceName}/*")
    })
})

var canPerformAction = require("../src/iam_policy").canPerformAction

var policy = {
    "hls:*": {
        "resources": {
            "values": [
                "/organizations/heatworks/*"
            ],
            "type": "String"
        }
    }
}

var devicePolicy = {
    "hls:dac:*": {
        "resources": {
            "values": [
                "/organizations/heatworks/devices/{deviceName}/*"
            ],
            "type": "String"
        }
    }
}

describe("canPerformAction", () => {
    it("should be able to publish data", () => {
        assert.equal(canPerformAction(policy, "hls:dac:Publish"), "hls:*")
    })
    it("should be able to get token", () => {
        assert(canPerformAction(policy, "hls:iam:AccessToken:GET"))
    })
    it("should not be able to perform", () => {
        assert(!canPerformAction(devicePolicy, "hls:iam:AccessToken:GET"))
    })
    it("should be able to perform action", () => {
        assert.equal(canPerformAction(devicePolicy, "hls:dac:Publish"), "hls:dac:*")
    })
})

var canUseResource = require("../src/iam_policy").canUseResource

describe("canUseResource", () => {
    it("should be able to use resource", () => {
        assert(canUseResource(policy, "hls:*", "/organizations/heatworks/devices/{deviceName}/{channelName}"))
        assert(canUseResource(policy, "hls:*", "/organizations/heatworks/ANYTHING_PASSED_HERE"))
    })
    it("should only be able to use own resource", () => {
        assert(canUseResource(devicePolicy, "hls:dac:*", "/organizations/heatworks/devices/{deviceName}/{channelName}"))
        assert(!canUseResource(devicePolicy, "hls:dac:*", "/organizations/heatworks/devices/{otherDeviceName}/{channelName}"))
    })
})

var checkPolicy = require("../src/iam_policy").checkPolicy

describe("checkPolicy", () => {
    it("should be able to perform action on resource", () => {
        assert(checkPolicy(policy, "hls:dac:Publish", "/organizations/heatworks/devices/{deviceName}/{channelName}"))
    })
    it("should not able to get data", () => {
        assert(checkPolicy(policy, "hls:dac:Data:GET", "/organizations/heatworks/devices/{deviceName}/{channelName}"))
    })
    it("should be able to subscribe", () => {
        assert(checkPolicy(policy, "hls:dac:subscribe", "/organizations/heatworks/devices/{deviceName}/{channelName}"))
    })
})