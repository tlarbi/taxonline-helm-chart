{{/*
Expand the name of the chart.
*/}}
{{- define "taxonline-frontend.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "taxonline-frontend.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- printf "%s" $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "taxonline-frontend.labels" -}}
helm.sh/chart: {{ .Chart.Name }}-{{ .Chart.Version }}
app.kubernetes.io/name: {{ include "taxonline-frontend.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/component: frontend
app.kubernetes.io/part-of: taxonline-dashboard
{{- end }}

{{/*
Selector labels
*/}}
{{- define "taxonline-frontend.selectorLabels" -}}
app.kubernetes.io/name: {{ include "taxonline-frontend.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}
