{{- define "tol-keycloak.name" -}}
{{- .Chart.Name | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "tol-keycloak.fullname" -}}
{{- printf "%s" .Release.Name | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "tol-keycloak.labels" -}}
app.kubernetes.io/name: {{ include "tol-keycloak.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{- define "tol-keycloak.selectorLabels" -}}
app.kubernetes.io/name: {{ include "tol-keycloak.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}
