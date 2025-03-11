exports.handler = async function(event, context) {
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Function is working correctly!",
        timestamp: new Date().toISOString(),
        environmentVarsAvailable: {
          zettleClientId: !!process.env.ZETTLE_CLIENT_ID,
          zettleClientSecret: !!process.env.ZETTLE_CLIENT_SECRET
        }
      })
    };
  };