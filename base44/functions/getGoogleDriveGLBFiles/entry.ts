import { createClientFromRequest } from 'npm:@base44/sdk@0.8.27';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get Google Drive access token
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googledrive');
    
    // Folder ID from the URL
    const folderId = '1t3QKSJ_ms4MpYe2lC8ZOsh8DXhN5CI21';
    
    // Query for GLB files in the folder
    const query = encodeURIComponent(`'${folderId}' in parents and mimeType='application/octet-stream' and name contains '.glb' and trashed=false`);
    const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,mimeType,webContentLink,createdTime)&pageSize=100`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      }
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Google Drive API error: ${response.status} ${error}`);
    }
    
    const data = await response.json();
    
    // Transform file data - use webContentLink which allows direct download
    const glbFiles = (data.files || []).map(file => ({
      id: file.id,
      name: file.name,
      url: file.webContentLink, // Direct download link (add ?export=download for force download)
      createdTime: file.createdTime,
      downloadUrl: `${file.webContentLink}?export=download`
    }));
    
    return Response.json({
      success: true,
      files: glbFiles,
      total: glbFiles.length
    });
  } catch (error) {
    console.error('Error fetching Google Drive files:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});