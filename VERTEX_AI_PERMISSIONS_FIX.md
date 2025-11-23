# Fix Vertex AI Permissions Error

## Current Error
```
PERMISSION_DENIED: Missing or insufficient permissions
```

## Problem
The Vertex AI service account (`vertex-ai-yudi@yudi-8bd6f.iam.gserviceaccount.com`) doesn't have the necessary IAM roles to access Vertex AI APIs.

## Solution

### Option 1: Using Google Cloud Console (Recommended)

1. Go to Google Cloud Console: https://console.cloud.google.com/iam-admin/iam?project=yudi-8bd6f

2. Find the service account: `vertex-ai-yudi@yudi-8bd6f.iam.gserviceaccount.com`

3. Click the **Edit** (pencil icon) next to it

4. Click **ADD ANOTHER ROLE** and add these roles:
   - **Vertex AI User** (`roles/aiplatform.user`)
   - **Service Account Token Creator** (`roles/iam.serviceAccountTokenCreator`)

5. Click **Save**

### Option 2: Using gcloud CLI

Run these commands:

```bash
# Set your project
gcloud config set project yudi-8bd6f

# Add Vertex AI User role
gcloud projects add-iam-policy-binding yudi-8bd6f \
    --member="serviceAccount:vertex-ai-yudi@yudi-8bd6f.iam.gserviceaccount.com" \
    --role="roles/aiplatform.user"

# Add Service Account Token Creator role
gcloud projects add-iam-policy-binding yudi-8bd6f \
    --member="serviceAccount:vertex-ai-yudi@yudi-8bd6f.iam.gserviceaccount.com" \
    --role="roles/iam.serviceAccountTokenCreator"
```

## After Adding Permissions

**No need to redeploy!** Just refresh your browser and try the chat feature again at https://chat.yudi.co.in

The permissions take effect immediately.

## Verification

Once permissions are added, you should see chat responses instead of the "Missing or insufficient permissions" error.
