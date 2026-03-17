{{- define "tol-auth.name" -}}
{{- .Chart.Name | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "tol-auth.fullname" -}}
{{- printf "%s" .Release.Name | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "tol-auth.labels" -}}
app.kubernetes.io/name: {{ include "tol-auth.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{- define "tol-auth.selectorLabels" -}}
app.kubernetes.io/name: {{ include "tol-auth.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

