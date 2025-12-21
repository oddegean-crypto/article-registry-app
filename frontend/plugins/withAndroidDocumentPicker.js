const { withAndroidManifest } = require('expo/config-plugins');

/**
 * Expo config plugin to add Android queries for document picker support on Android 11+ (API 30+)
 * This is required for the document picker to work properly with scoped storage.
 */
module.exports = function withAndroidDocumentPicker(config) {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;
    
    // Ensure queries section exists
    if (!androidManifest.manifest.queries) {
      androidManifest.manifest.queries = [];
    }
    
    // Add document picker intents to queries
    const queriesSection = androidManifest.manifest.queries;
    
    // Check if we already have intents array, if not create one
    let intentsArray = [];
    if (Array.isArray(queriesSection)) {
      const existingQueries = queriesSection[0] || {};
      intentsArray = existingQueries.intent || [];
    }
    
    // Intent for OPEN_DOCUMENT (file picker)
    const openDocumentIntent = {
      $: {},
      action: [{ $: { 'android:name': 'android.intent.action.OPEN_DOCUMENT' } }],
      category: [
        { $: { 'android:name': 'android.intent.category.DEFAULT' } },
        { $: { 'android:name': 'android.intent.category.OPENABLE' } }
      ],
      data: [{ $: { 'android:mimeType': '*/*' } }]
    };
    
    // Intent for GET_CONTENT (alternative file picker)
    const getContentIntent = {
      $: {},
      action: [{ $: { 'android:name': 'android.intent.action.GET_CONTENT' } }],
      category: [
        { $: { 'android:name': 'android.intent.category.DEFAULT' } },
        { $: { 'android:name': 'android.intent.category.OPENABLE' } }
      ],
      data: [{ $: { 'android:mimeType': '*/*' } }]
    };
    
    // Intent for OPEN_DOCUMENT_TREE (folder access)
    const openDocumentTreeIntent = {
      $: {},
      action: [{ $: { 'android:name': 'android.intent.action.OPEN_DOCUMENT_TREE' } }]
    };
    
    // Intent for VIEW with https (web links)
    const viewHttpsIntent = {
      $: {},
      action: [{ $: { 'android:name': 'android.intent.action.VIEW' } }],
      category: [{ $: { 'android:name': 'android.intent.category.BROWSABLE' } }],
      data: [{ $: { 'android:scheme': 'https' } }]
    };
    
    // Intent for SENDTO mailto (email)
    const sendToMailIntent = {
      $: {},
      action: [{ $: { 'android:name': 'android.intent.action.SENDTO' } }],
      data: [{ $: { 'android:scheme': 'mailto' } }]
    };
    
    // Intent for SEND (sharing)
    const sendIntent = {
      $: {},
      action: [{ $: { 'android:name': 'android.intent.action.SEND' } }],
      data: [{ $: { 'android:mimeType': '*/*' } }]
    };
    
    // Intent for SEND_MULTIPLE (multiple file sharing)
    const sendMultipleIntent = {
      $: {},
      action: [{ $: { 'android:name': 'android.intent.action.SEND_MULTIPLE' } }],
      category: [{ $: { 'android:name': 'android.intent.category.DEFAULT' } }],
      data: [{ $: { 'android:mimeType': '*/*' } }]
    };
    
    // Add all intents
    intentsArray.push(
      openDocumentIntent,
      getContentIntent,
      openDocumentTreeIntent,
      viewHttpsIntent,
      sendToMailIntent,
      sendIntent,
      sendMultipleIntent
    );
    
    // Set the queries section
    androidManifest.manifest.queries = [{ intent: intentsArray }];
    
    return config;
  });
};