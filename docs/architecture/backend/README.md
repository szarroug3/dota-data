# Backend Architecture

This directory contains the backend architecture documentation for the Dota Scout Assistant.

## 📁 Structure

```
docs/architecture/backend/
├── README.md                    # This navigation file
├── data-flow.md                 # Backend data flow patterns
└── api-endpoints.md             # API endpoint documentation
```

## 📋 Documentation Overview

### **[Data Flow](./data-flow.md)** - Backend Data Flow Patterns
- Complete backend data flow architecture
- Mock mode and real mode behavior
- Caching, rate limiting, and queueing integration
- Error handling and special endpoint cases

### **[API Endpoints](./api-endpoints.md)** - API Endpoint Documentation
- Comprehensive API endpoint overview
- Endpoint details and parameters
- OpenAPI documentation integration
- Error responses and examples

## 🔗 Related Documentation

- **[Frontend Architecture](../frontend/)**: Frontend component architecture
- **[Infrastructure](../infrastructure/)**: Caching, rate limiting, and queueing
- **[Types](../types/)**: TypeScript type organization
- **[Implementation](../implementation/)**: Project implementation status

## 🎯 Backend Principles

### **API Design**
- **RESTful Patterns**: Standard REST API design
- **Error Handling**: Consistent error responses
- **Caching**: Intelligent caching with TTL
- **Rate Limiting**: Per-service rate limiting

### **Data Processing**
- **External APIs**: OpenDota, Dotabuff integration
- **Data Transformation**: Processing and validation
- **Mock Support**: Development and testing support
- **Background Jobs**: Queue-based processing

### **Performance**
- **Caching Layer**: Redis-first with memory fallback
- **Rate Limiting**: Distributed rate limiting
- **Queue Management**: Background job processing
- **Error Recovery**: Graceful degradation 