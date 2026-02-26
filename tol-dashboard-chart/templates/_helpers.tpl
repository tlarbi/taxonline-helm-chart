{{- define "taxonline-dashboard.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "taxonline-dashboard.labels" -}}
helm.sh/chart: {{ .Chart.Name }}-{{ .Chart.Version }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/part-of: taxonline-dashboard
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/* Résolution du nom de service frontend */}}
{{- define "taxonline-dashboard.frontendService" -}}
{{- printf "%s-taxonline-frontend" .Release.Name | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/* Résolution du nom de service backend */}}
{{- define "taxonline-dashboard.backendService" -}}
{{- printf "%s-taxonline-backend" .Release.Name | trunc 63 | trimSuffix "-" }}
{{- end }}
