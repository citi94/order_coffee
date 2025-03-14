// netlify/functions/apple-pay-validation.js
exports.handler = async function(event, context) {
    // This function serves the domain association file Apple requires
    // This must be accessible at /.well-known/apple-developer-merchantid-domain-association
    
    // You will need to obtain this file from your Apple Developer account
    // Replace this with your actual domain association content
    const domainAssociationContent = process.env.APPLE_DOMAIN_ASSOCIATION_CONTENT;
    
    if (!domainAssociationContent) {
      return {
        statusCode: 500,
        body: "Apple Pay domain association file content not configured"
      };
    }
    
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "text/plain",
      },
      body: domainAssociationContent
    };
  };