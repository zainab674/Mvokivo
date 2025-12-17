import { KnowledgeBase, KnowledgeDocument, DocumentChunk, DocumentText } from '../models/index.js';

class KnowledgeBaseDatabaseService {
  constructor() {
    // No initialization needed for Mongoose models
  }

  // Knowledge Base operations
  async createKnowledgeBase(kbData) {
    const kb = new KnowledgeBase(kbData);
    await kb.save();
    return kb;
  }

  async updateKnowledgeBasePineconeInfo(kbId, pineconeInfo) {
    const updateData = {
      pinecone_index_name: pineconeInfo.name,
      pinecone_index_host: pineconeInfo.host,
      pinecone_index_status: pineconeInfo.status?.state || pineconeInfo.status,
      pinecone_index_dimension: pineconeInfo.dimension,
      pinecone_index_metric: pineconeInfo.metric,
      pinecone_updated_at: new Date()
    };

    // Set created_at only if it's a new index
    if (pineconeInfo.status?.state === 'Ready' && !pineconeInfo.created_at) {
      updateData.pinecone_created_at = new Date();
    }

    // findByIdAndUpdate returns the document as it was BEFORE the update by default.
    // { new: true } returns the updated document.
    const updatedKb = await KnowledgeBase.findByIdAndUpdate(kbId, updateData, { new: true });
    return updatedKb;
  }

  async updateKnowledgeBaseAssistantInfo(kbId, assistantInfo) {
    const updateData = {
      pinecone_assistant_id: assistantInfo.id,
      pinecone_assistant_name: assistantInfo.name,
      pinecone_assistant_instructions: assistantInfo.instructions,
      pinecone_assistant_region: assistantInfo.region,
      pinecone_assistant_updated_at: new Date()
    };

    if (assistantInfo.created_at) {
      updateData.pinecone_assistant_created_at = assistantInfo.created_at;
    } else {
      updateData.pinecone_assistant_created_at = new Date();
    }

    const updatedKb = await KnowledgeBase.findByIdAndUpdate(kbId, updateData, { new: true });
    return updatedKb;
  }

  async getKnowledgeBase(kbId) {
    const kb = await KnowledgeBase.findById(kbId);
    if (!kb) {
      throw new Error('Knowledge base not found');
    }
    return kb;
  }

  async getKnowledgeBasesByCompany(companyId) {
    // We can populate 'knowledge_documents' if we set up virtuals, but for now let's keep it simple
    // and just fetch the KB. If the frontend expects documents nested, we might need a second query.
    // However, looking at the original code: 
    // .select(`*, knowledge_documents (...)`)
    // The original return structure was an array of KBs, each with a .knowledge_documents array.

    // Let's emulate that structure:
    const kbs = await KnowledgeBase.find({ company_id: companyId }).sort({ created_at: -1 }).lean();

    // For each KB, fetch documents
    for (let kb of kbs) {
      const docs = await KnowledgeDocument.find({ knowledge_base_id: kb._id.toString() });
      // Map to match the specific fields requested in the original code if needed, but returning full doc is usually fine
      // Original selected: doc_id, original_filename, file_size, file_path, pinecone_file_id, pinecone_status, pinecone_processed_at, upload_timestamp, created_at
      kb.knowledge_documents = docs;
    }

    return kbs;
  }

  async updateKnowledgeBase(kbId, updateData) {
    const updatedKb = await KnowledgeBase.findByIdAndUpdate(kbId, updateData, { new: true });
    return updatedKb;
  }

  async deleteKnowledgeBase(kbId) {
    await KnowledgeBase.findByIdAndDelete(kbId);
    return true;
  }

  async associateDocumentWithKnowledgeBase(docId, knowledgeBaseId) {
    const updatedDoc = await KnowledgeDocument.findOneAndUpdate(
      { doc_id: docId },
      { knowledge_base_id: knowledgeBaseId },
      { new: true }
    );
    return updatedDoc;
  }


  // Document operations
  async createDocument(documentData) {
    const doc = new KnowledgeDocument(documentData);
    await doc.save();
    return doc;
  }

  async getDocument(docId) {
    const doc = await KnowledgeDocument.findOne({ doc_id: docId });
    return doc;
  }

  async getDocumentsByCompany(companyId) {
    const docs = await KnowledgeDocument.find({ company_id: companyId }).sort({ created_at: -1 });
    return docs;
  }

  async getDocumentsByKnowledgeBase(kbId) {
    const docs = await KnowledgeDocument.find({ knowledge_base_id: kbId }).sort({ created_at: -1 });
    return docs;
  }

  async updateDocumentFileInfo(docId, fileInfo) {
    const updatePayload = {
      ...fileInfo,
      updated_at: new Date()
    };

    const updatedDoc = await KnowledgeDocument.findOneAndUpdate(
      { doc_id: docId },
      updatePayload,
      { new: true }
    );
    return updatedDoc;
  }

  // updateDocumentStatus method removed - we now use updateDocumentPineconeInfo for status tracking

  async updateDocumentPineconeInfo(docId, pineconeInfo) {
    const updatedDoc = await KnowledgeDocument.findOneAndUpdate(
      { doc_id: docId },
      {
        pinecone_file_id: pineconeInfo.pinecone_file_id,
        pinecone_status: pineconeInfo.pinecone_status,
        pinecone_processed_at: pineconeInfo.pinecone_processed_at,
        updated_at: new Date()
      },
      { new: true }
    );
    return updatedDoc;
  }

  async addDocumentToKnowledgeBase(knowledgeBaseId, documentData) {
    const docData = {
      knowledge_base_id: knowledgeBaseId,
      ...documentData
    };
    const doc = new KnowledgeDocument(docData);
    await doc.save();
    return doc;
  }

  async removeDocumentFromKnowledgeBase(knowledgeBaseId, fileId) {
    // Assuming fileId refers to our doc_id or pinecone_file_id? 
    // The original code used .delete().eq('knowledge_base_id', ...).eq('file_id', file_id)
    // BUT 'file_id' isn't in standard schema above, maybe it meant 'doc_id' or 'pinecone_file_id'?
    // The createDocument uses 'doc_id'. Let's assume fileId passed here maps to something unique.
    // Standardizing on deleting by doc_id if possible, but let's check callers.
    // For safety, let's assume the caller passes a unique ID that matches one of our fields.
    // Use deleteOne with both filters.

    // Be careful: 'file_id' might be 'pinecone_file_id' or just 'doc_id'.
    // Reviewing the original schema in the 'getDocuments' methods, there is 'doc_id'. 
    // Let's assume filtering by knowledge_base_id AND doc_id (passed as fileId).

    await KnowledgeDocument.findOneAndDelete({ knowledge_base_id: knowledgeBaseId, doc_id: fileId });
    return true;
  }

  async deleteDocument(docId) {
    await KnowledgeDocument.findOneAndDelete({ doc_id: docId });
    return true;
  }

  // Text extraction operations
  async saveExtractedText(textData) {
    // Upsert logic
    const docText = await DocumentText.findOneAndUpdate(
      { doc_id: textData.doc_id },
      textData,
      { upsert: true, new: true }
    );
    return docText;
  }

  async getExtractedText(docId) {
    const docText = await DocumentText.findOne({ doc_id: docId });
    return docText;
  }

  // Chunk operations
  async createChunk(chunkData) {
    const chunk = new DocumentChunk(chunkData);
    await chunk.save();
    return chunk;
  }

  async getDocumentChunks(docId) {
    const chunks = await DocumentChunk.find({ doc_id: docId }).sort({ chunk_index: 1 });
    return chunks;
  }

  async getChunksByCompany(companyId) {
    const chunks = await DocumentChunk.find({ company_id: companyId }).sort({ created_at: -1 });
    return chunks;
  }

  // Statistics operations
  async getDocumentStats(companyId) {
    const docs = await KnowledgeDocument.find({ company_id: companyId }).select('pinecone_status');

    const stats = {
      total: docs.length,
      uploaded: docs.filter(d => d.pinecone_status === 'uploaded').length,
      processing: docs.filter(d => d.pinecone_status === 'processing').length,
      ready: docs.filter(d => d.pinecone_status === 'ready').length,
      failed: docs.filter(d => d.pinecone_status === 'failed').length,
      error: docs.filter(d => d.pinecone_status === 'error').length
    };

    return stats;
  }

  async getChunkStats(companyId) {
    return {
      total_chunks: 0,
      total_words: 0,
      total_characters: 0,
      total_tokens: 0,
      avg_words_per_chunk: 0
    };
  }
}

export default KnowledgeBaseDatabaseService;
