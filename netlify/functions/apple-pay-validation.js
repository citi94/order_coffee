// netlify/functions/apple-pay-validation.js
exports.handler = async function(event, context) {
    // This function serves the domain association file Apple requires
    // This must be accessible at /.well-known/apple-developer-merchantid-domain-association
    
    try {
      // You will need to obtain this file from your Apple Developer account
      // Replace this with your actual domain association content
      const domainAssociationContent = process.env.APPLE_DOMAIN_ASSOCIATION_CONTENT;
      
      if (!domainAssociationContent) {
        console.error('APPLE_DOMAIN_ASSOCIATION_CONTENT environment variable is not set');
        return {
          statusCode: 500,
          body: "Apple Pay domain association file content not configured"
        };
      }
      
      // Return the plain text content for Apple to validate
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "text/plain",
          "Cache-Control": "max-age=3600" // Cache for 1 hour
        },
        body: domainAssociationContent
      };
    } catch (error) {
      console.error('Error serving Apple Pay domain association file:', error);
      return {
        statusCode: 500,
        body: "Error serving domain validation file"
      };
    }
  };