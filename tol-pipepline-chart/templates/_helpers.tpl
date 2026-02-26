{{- define "tol-pipeline.env" -}}
- name: DATA_PATH
  value: {{ .Values.pipeline.dataPath | quote }}
- name: BRONZE_PATH
  value: {{ .Values.pipeline.bronzePath | quote }}
- name: SILVER_PATH
  value: {{ .Values.pipeline.silverPath | quote }}
- name: GOLD_PATH
  value: {{ .Values.pipeline.goldPath | quote }}
- name: CHUNKS_JSONL
  value: "{{ .Values.pipeline.silverPath }}/chunks.jsonl"
- name: S3_ENDPOINT
  value: {{ .Values.s3.endpoint | quote }}
- name: S3_BUCKET
  value: {{ .Values.s3.bucket | quote }}
- name: AWS_DEFAULT_REGION
  value: {{ .Values.s3.region | quote }}
- name: AWS_ACCESS_KEY_ID
  valueFrom:
    secretKeyRef:
      name: {{ .Values.s3.secretName }}
      key: AWS_ACCESS_KEY_ID
- name: AWS_SECRET_ACCESS_KEY
  valueFrom:
    secretKeyRef:
      name: {{ .Values.s3.secretName }}
      key: AWS_SECRET_ACCESS_KEY
- name: QDRANT_URL
  value: {{ .Values.qdrant.url | quote }}
- name: QDRANT_COLLECTION
  value: {{ .Values.qdrant.collection | quote }}
- name: OLLAMA_URL
  value: {{ .Values.ollama.url | quote }}
- name: OLLAMA_EMBED_MODEL
  value: {{ .Values.ollama.model | quote }}
- name: OLLAMA_TIMEOUT
  value: {{ .Values.ollama.timeout | quote }}
- name: OS_URL
  value: {{ .Values.opensearch.url | quote }}
- name: OS_INDEX
  value: {{ .Values.opensearch.index | quote }}
- name: OS_USER
  valueFrom:
    secretKeyRef:
      name: {{ .Values.opensearch.secretName }}
      key: OS_USER
- name: OS_PASS
  valueFrom:
    secretKeyRef:
      name: {{ .Values.opensearch.secretName }}
      key: OS_PASS
- name: CHUNK_CHARS
  value: {{ .Values.pipeline.chunkChars | quote }}
- name: OVERLAP_CHARS
  value: {{ .Values.pipeline.overlapChars | quote }}
- name: MIN_CHARS
  value: {{ .Values.pipeline.minChars | quote }}
- name: SKIP_TOC
  value: {{ .Values.pipeline.skipToc | quote }}
- name: DEDUP
  value: {{ .Values.pipeline.dedup | quote }}
- name: BATCH
  value: {{ .Values.pipeline.batchQdrant | quote }}
- name: BATCH_OS
  value: {{ .Values.pipeline.batchOpensearch | quote }}
{{- end }}

{{- define "tol-pipeline.volumeMount" -}}
- name: datalake
  mountPath: {{ .Values.pipeline.dataPath }}
{{- end }}

{{- define "tol-pipeline.volume" -}}
- name: datalake
  {{- if .Values.persistence.existingClaim }}
  persistentVolumeClaim:
    claimName: {{ .Values.persistence.existingClaim }}
  {{- else }}
  persistentVolumeClaim:
    claimName: tol-pipeline-pvc
  {{- end }}
{{- end }}
