{{/*
TaxOnline Dashboard - Helm Helpers
*/}}

{{- define "taxonline.fullname" -}}
{{- printf "%s-%s" .Release.Name .Chart.Name | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "taxonline.backend.fullname" -}}
{{- printf "%s-backend" .Release.Name | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "taxonline.frontend.fullname" -}}
{{- printf "%s-frontend" .Release.Name | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "taxonline.labels" -}}
helm.sh/chart: {{ .Chart.Name }}-{{ .Chart.Version }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{- define "taxonline.backend.labels" -}}
{{ include "taxonline.labels" . }}
app.kubernetes.io/name: {{ include "taxonline.backend.fullname" . }}
app.kubernetes.io/component: backend
{{- end }}

{{- define "taxonline.backend.selectorLabels" -}}
app.kubernetes.io/name: {{ include "taxonline.backend.fullname" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{- define "taxonline.frontend.labels" -}}
{{ include "taxonline.labels" . }}
app.kubernetes.io/name: {{ include "taxonline.frontend.fullname" . }}
app.kubernetes.io/component: frontend
{{- end }}

{{- define "taxonline.frontend.selectorLabels" -}}
app.kubernetes.io/name: {{ include "taxonline.frontend.fullname" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{- define "taxonline.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "taxonline.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Secret name
*/}}
{{- define "taxonline.secretName" -}}
{{- printf "%s-secrets" .Release.Name }}
{{- end }}
