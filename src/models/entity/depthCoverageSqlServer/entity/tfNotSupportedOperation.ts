import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('AMEClientTools_Coverage_Result_TFNotSupportedOperations')
export class TfNotSupportedOperation {
    @PrimaryColumn()
    path: string;
    @Column({ nullable: true })
    operationName: string;
    @Column({ nullable: true })
    fullResourceType: string;
    @Column({ nullable: true })
    operationId: string;
    @Column({ nullable: true })
    httpMethod: string;
    @Column({ nullable: true })
    swaggerApiVersion: string;
    @Column({ nullable: true })
    fileName: string;
}
