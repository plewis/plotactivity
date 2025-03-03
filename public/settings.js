const axisinfo = {
  xaxislabel:"Frequency of S allele",
  xaxismin:"0.0",
  xaxismax:"1.0",
  xaxisticks:"4",
  xaxisfmt:".2f",
  yaxislabel:"Mean fitness",
  yaxismin:"0.0",
  yaxismax:"1.0",
  yaxisticks:"4",
  yaxisfmt:".2f"
}

const log_heartbeat_messages = false;

const fx = function(x) {
    // Value of function at x
    return x*x*0.14 + 2.0*x*(1.0-x)*1.0 + (1.0-x)*(1.0-x)*0.88;
}

const dfx = function(x) {
    // First derivative of function at x
    return 2.0 - 2.0*0.88 + 2.0*(0.14 + 0.88 - 2.0)*x;
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = { axisinfo, log_heartbeat_messages, fx, dfx };
}
